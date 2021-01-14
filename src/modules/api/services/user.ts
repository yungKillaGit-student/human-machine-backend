import {createHmac} from 'crypto';

import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {CrudRequest} from '@nestjsx/crud';
import {plainToClass} from 'class-transformer';
import {isEmail} from 'class-validator';
import {sign, verify} from 'jsonwebtoken';
import {EntityManager, Repository, Transaction, TransactionManager} from 'typeorm';

import config from '../../../configuration';
import {User} from '../../../entities';
import {ErrorMessages, ErrorUtils, ExceptionBuilder, Logger} from '../../../utils';
import {UserCreateDto, UserUpdateDto} from '../interfaces';

import {CommonCrudService} from './common-crud';
import {FileService} from './file';
import {IMailMessengerOptions, MailMessengerService} from './messenger/mail';
import {MailMessengerTypes} from './messenger/types';

@Injectable()
export class UserService extends CommonCrudService<User> {
    logger = Logger.getLogger('UserService');

    constructor(
        @InjectRepository(User) repo: Repository<User>,
        private readonly fileService: FileService,
        private readonly mailMessengerService: MailMessengerService,
    ) {
        super(repo);
    }

    @Transaction()
    async createUser(
        createDto: UserCreateDto,
        @TransactionManager() manager?: EntityManager,
    ): Promise<User> {
        this.logger.trace('Create User', 'createUser');

        if (createDto.repeatedPassword !== createDto.password) {
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST, {entity: User.name, parameters: ['repeatedPassword']});
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

        if (config.env !== 'test') {
            await this.sendWelcomeEmailToUser(createDto.password, savedUser);
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

        if (updateDto.newPassword) {
            const {currentPassword, repeatedPassword, newPassword} = updateDto;
            const isCurrentPasswordValid = currentPassword && User.hashPassword(currentPassword) === oldUser.password;
            if (repeatedPassword && repeatedPassword === newPassword && isCurrentPasswordValid) {
                newUser.password = User.hashPassword(updateDto.newPassword);
            } else if (!repeatedPassword) {
                ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST, {entity: User.name, parameters: ['repeatedPassword']});
            } else if (!currentPassword || !isCurrentPasswordValid) {
                ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST, {entity: User.name, parameters: ['currentPassword']});
            }
        }

        if (updateDto.imageName) {
            const uploadedImage = await this.fileService.get(updateDto.imageName);
            newUser.imageId = uploadedImage.id;
        }

        try {
            await manager.save(User, newUser);
        } catch (err) {
            ErrorUtils.handleDBException(err, User.name, newUser);
        }

        const {user: newObject} = await this.getUserResponse(id, manager);
        return {oldObject: plainToClass(User, oldUser), newObject};
    }

    @Transaction()
    async verifyUser(
        id: string,
        token: string,
        @TransactionManager() manager?: EntityManager,
    ): Promise<User> {
        this.logger.trace(`Verify user with id ${id}`, 'verifyUser');

        const oldUser = await manager.findOne(User, {id});
        if (!oldUser) {
            this.logger.debug(`Entry doesn't exist: '${id}'`, 'verifyUser');
            ErrorUtils.throwHttpException(ExceptionBuilder.OBJECT_NOT_FOUND, {entity: User.name, id});
        } else if (oldUser.isConfirmed) {
            this.logger.debug('This user is already confirmed', 'verifyUser');
            ErrorUtils.throwHttpException(ExceptionBuilder.RESOURCE_IS_NOT_LONGER_AVAILABLE);
        }

        let decoded;
        try {
            decoded = verify(token, config.jwtSecret);
        } catch (err) {
            ErrorUtils.throwHttpException(ExceptionBuilder.UNAUTHORIZED);
        }

        const {id: decodedId, email} = decoded;

        if (decodedId !== id) {
            this.logger.debug('Decoded id is not equal to id from url', 'verifyUser');
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST, {
                entity: User.name,
                parameters: {decodedId, userId: id},
            });
        }

        if (oldUser.email !== email) {
            this.logger.debug('Decoded email is not equal to user email', 'verifyUser');
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST, {
                entity: User.name,
                parameters: {decodedEmail: email, userEmail: oldUser.email},
            });
        } else {
            const newUser = manager.create(User);
            Object.entries({...oldUser, isConfirmed: true}).forEach(([k, v]) => newUser[k] = v);

            try {
                await manager.save(User, newUser);
            } catch (err) {
                ErrorUtils.handleDBException(err, User.name, newUser);
            }
        }

        const {user: verifiedUser} = await this.getUserResponse(id, manager);
        return verifiedUser;
    }

    async sendWelcomeEmailToUser(
        userPassword: string,
        user: User,
    ): Promise<any> {
        this.logger.trace('Send welcome email to target user', 'sendWelcomeEmailToUser');

        const userName = `${user.firstName} ${user.lastName}`;
        const mailOptions: IMailMessengerOptions = {
            confirmToken: this.generateJwt(user),
            email: user.email,
            type: MailMessengerTypes.USER_CREATED,
            userId: user.id,
            password: userPassword,
            name: userName,
        };
        try {
            await this.mailMessengerService.send(mailOptions);
        } catch (err) {
            this.logger.debug(`Failed attempt to send email to user with id = ${user.id}`, 'sendWelcomeEmailToUser');
            ErrorUtils.throwHttpException(ExceptionBuilder.FAILED_ATTEMPT_TO_SEND_EMAIL, {userName, userEmail: user.email});
        }
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
