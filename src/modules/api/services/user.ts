import {createHmac} from 'crypto';
import {URL} from 'url';

import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {CrudRequest} from '@nestjsx/crud';
import {plainToClass} from 'class-transformer';
import {isEmail} from 'class-validator';
import {sign} from 'jsonwebtoken';
import {EntityManager, Repository, Transaction, TransactionManager} from 'typeorm';

import config from '../../../configuration';
import {User} from '../../../entities';
import {ErrorUtils, ExceptionBuilder, Guid, Logger} from '../../../utils';
import {UserCreateDto, UserUpdateDto} from '../interfaces';

import {CommonCrudService} from './common-crud';

const {
    minimalLength: minimalPasswordLength,
    hasNumbers: hasPasswordNumbers,
    hasUppersAndLowers: hasPasswordUppersAndLowers,
} = config.userSettings.password.requirements;
const resetPasswordLifetime = config.userSettings.password.reset.lifetime * 1000;
const redirectLifetime = config.userSettings.redirect.lifetime * 1000;

@Injectable()
export class UserService extends CommonCrudService<User> {
    logger = Logger.getLogger('UserService');

    constructor(
        @InjectRepository(User) repo: Repository<User>,
    ) {
        super(repo);
    }

    @Transaction()
    async createUser(
        createDto: UserCreateDto,
        @TransactionManager() manager?: EntityManager,
    ): Promise<User> {
        this.logger.trace('Create User', 'createUser');

        const passwordValidation = User.validatePassword(createDto.password, minimalPasswordLength, hasPasswordUppersAndLowers, hasPasswordNumbers);
        if (!passwordValidation.verified) {
            this.logger.debug(`Wrong password: '${createDto.password}', ${JSON.stringify(passwordValidation)}`, 'createUser');
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST, {entity: User.name, parameter: ['password']});
        }
        if (!isEmail(createDto.email)) {
            this.logger.debug(`Wrong email: '${createDto.email}'`, 'createUser');
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST, {entity: User.name, parameter: ['email']});
        }

        const newUser = manager.create(User);
        Object.entries(createDto).forEach(([k, v]) => newUser[k] = v);
        newUser.password = User.hashPassword(createDto.password);
        newUser.email = createDto.email.toLowerCase();
        let savedUser: User = null;
        try {
            savedUser = await manager.save(User, newUser);
        } catch (err) {
            ErrorUtils.handleDBException(err, User.name, newUser);
        }

        const {user} = await this.getUserResponse(savedUser.id, manager);
        return user;
    }

    @Transaction()
    async updateUser(
        id: string,
        updateDto: UserUpdateDto,
        @TransactionManager() manager?: EntityManager,
    ): Promise<{oldObject: User; newObject: User}> {
        this.logger.trace(`Update user with id ${id}`, 'updateUser');

        const oldUser = await manager.findOne(User, {id});
        if (!oldUser) {
            this.logger.debug(`Entry doesn't exist: '${id}'`, 'updateUser');
            ErrorUtils.throwHttpException(ExceptionBuilder.OBJECT_NOT_FOUND, {entity: User.name, id});
        }
        const newUser = manager.create(User);
        Object.entries({...oldUser, ...updateDto}).forEach(([k, v]) => newUser[k] = v);

        if (updateDto.email) {
            newUser.email = updateDto.email.toLowerCase();
        }

        if (updateDto.password) {
            const passwordValidation = User.validatePassword(updateDto.password, minimalPasswordLength, hasPasswordUppersAndLowers, hasPasswordNumbers);
            if (!passwordValidation.verified) {
                this.logger.debug(`Wrong password: '${updateDto.password}', ${JSON.stringify(passwordValidation)}`, 'updateUser');
                ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST, {entity: User.name, parameters: ['password']});
            }
            newUser.password = User.hashPassword(updateDto.password);
        }

        try {
            await manager.save(User, newUser); // manager.update() will not understand ManyToMany relations and will try to update with nonexistent user_id field
        } catch (err) {
            ErrorUtils.handleDBException(err, User.name, newUser);
        }

        const {user: newObject} = await this.getUserResponse(id, manager);
        return {oldObject: plainToClass(User, oldUser), newObject};
    }

    async getManyUsers(crudReq: CrudRequest) {
        this.logger.trace('Get users', 'getManyUsers');
        return this.getMany(crudReq);
    }

    async getUserResponse(
        id: string,
        manager?: EntityManager,
    ): Promise<{user: User}> {
        this.logger.trace('Get one User with response data', 'getUserResponse');
        const response: any = {};
        const where: {id: string} = {id};

        const findOptions = {where};
        const user = manager
            ? await manager.findOne(User, findOptions)
            : await this.repo.findOne(findOptions);
        response.user = plainToClass(User, user);
        return response;
    }

    async getOneWithPasswordValidation({email, password}: Partial<UserCreateDto>): Promise<User> {
        this.logger.trace('Get User with password validation', 'getOneWithPasswordValidation');

        const entry = await this.repo.findOne({
            email: email.toLowerCase(),
            password: createHmac('sha256', password).digest('hex'),
        });
        if (!entry) {
            this.logger.debug(`User not found: '${email}'`, 'getOneWithPasswordValidation');
            ErrorUtils.throwHttpException(ExceptionBuilder.OBJECT_NOT_FOUND, {entity: this.entityType.name});
        }
        entry.token = this.generateJwt(entry);

        return plainToClass(User, entry);
    }

    async getCurrent(userId: string): Promise<User> {
        this.logger.trace('Get current user', 'getCurrent');
        this.logger.debug(userId, 'getCurrent');
        const userData = await this.getUserResponse(userId);
        if (!userData.user) {
            ErrorUtils.throwHttpException(ExceptionBuilder.OBJECT_NOT_FOUND, {entity: User.name});
        }
        const user = userData.user;

        return plainToClass(User, user);
    }

    async signIn(userId: string): Promise<User> {
        this.logger.trace(`User (#${userId}) is signing in`, 'signIn');

        const user = await this.repo.findOne({id: userId});

        return plainToClass(User, user);
    }

    generateJwt(user: User, expiredDate?: Date): string {
        this.logger.trace('generateJwt', 'generateJwt');

        const exp = expiredDate
            ? expiredDate.getTime() / 1000
            : Math.round(Date.now() / 1000) + config.jwtLifeTime;

        return sign({
            id: user.id,
            email: user.email,
            exp: exp,
        }, config.jwtSecret);
    }
}