import {
    Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res, UsePipes, ValidationPipe,
} from '@nestjs/common';
import {ApiCookieAuth, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {
    Crud, CrudController, CrudOptions, CrudRequest, Override, ParsedRequest,
} from '@nestjsx/crud';
import {plainToClass} from 'class-transformer';
import {parse} from 'cookie';

import {User} from '../../../entities';
import {ErrorMessages} from '../../../utils';
import {UserCreateDto, UserSigninDto, UserUpdateDto} from '../interfaces';
import {SessionService, UserService} from '../services';

const crudOptions: CrudOptions = {
    model: {type: User},
    params: {id: {type: 'uuid', primary: true, field: 'id'}},
    routes: {
        exclude: ['createManyBase', 'replaceOneBase'],
        updateOneBase: {allowParamsOverride: true},
    },
    dto: {
        create: UserCreateDto,
        update: UserUpdateDto,
    },
    query: {
        exclude: ['password'],
        sort: [{field: 'createdAt', order: 'ASC'}],
        maxLimit: 250,
        alwaysPaginate: true,
    },
    validation: {transform: true},
};

@Crud(crudOptions)
@ApiTags('users')
@Controller('api/users')
@UsePipes(new ValidationPipe({transform: true}))
export class UserController implements CrudController<User> {

    constructor(public service: UserService, private readonly sessionService: SessionService) {
    }

    @ApiOperation({summary: 'Sign in existing user'})
    @ApiResponse({status: HttpStatus.ACCEPTED, description: 'User is signed in', type: User})
    @ApiResponse({status: HttpStatus.NOT_FOUND, description: ErrorMessages.OBJECT_NOT_FOUND})
    @HttpCode(HttpStatus.ACCEPTED)
    @Post('signin')
    async signIn(@Body() userSigninDto: UserSigninDto, @Res() res, @Req() req): Promise<User> {
        const {token, id: userId} = await this.service.getOneWithPasswordValidation(userSigninDto);

        const user = await this.service.signIn(userId);

        const newCookies = await this.sessionService.refreshToken(req, user);

        res.header('Set-Cookie', newCookies);
        res.send(user);
        return user;
    }

    @ApiOperation({summary: 'Sign out signed in user'})
    @ApiCookieAuth('token')
    @ApiResponse({status: HttpStatus.ACCEPTED, description: 'User is signed out', type: User})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: ErrorMessages.USER_UNAUTHORIZED})
    @HttpCode(HttpStatus.ACCEPTED)
    @Post('signout')
    async signOut(@Req() req, @Res() res): Promise<User> {
        const {user = {}} = {...req.params, ...req.raw.params};
        res.header('Set-Cookie', [
            'token=""; Max-Age=0; Path=/; HttpOnly; SameSite=Lax',
            'tokenExpiredDate=""; Max-Age=0; Path=/; SameSite=Lax;']);

        const cookies: any = parse(req.headers['cookie'] || '');
        const {token = ''} = cookies;
        if (token) {
            // await this.sessionService.removeSessionInfo(user.id);
        }

        res.send(user);
        return plainToClass(User, user);
    }

    @ApiOperation({summary: 'Get current user'})
    @ApiCookieAuth('token')
    @ApiResponse({status: HttpStatus.OK, description: 'User data', type: User})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: ErrorMessages.USER_UNAUTHORIZED})
    @ApiResponse({status: HttpStatus.NOT_FOUND, description: ErrorMessages.OBJECT_NOT_FOUND})
    @Get('current')
    async get(@Req() req): Promise<User> {
        const {user: reqUser = {id: ''}} = {...req.params, ...req.raw.params};
        return this.service.getCurrent(reqUser.id);
    }

    @Override('createOneBase')
    async create(@Req() req, @Body() userCreateDto: UserCreateDto): Promise<User> {
        return this.service.createUser(userCreateDto);
    }

    @Override('updateOneBase')
    @ApiCookieAuth('token')
    async update(@Req() req, @Param('id') id: string, @Body() userUpdateDto: UserUpdateDto): Promise<{ oldObject: User; newObject: User }> {
        return this.service.updateUser(id, userUpdateDto);
    }

    @Override('deleteOneBase')
    @ApiCookieAuth('token')
    async delete(@Param('id') id): Promise<User> {
        return this.service.delete(id);
    }

    @Override('getOneBase')
    async getById(@Param('id') id, @Req() req): Promise<User | void> {
        const {user} = await this.service.getUserResponse(id);
        return user;
    }

    @Override('getManyBase')
    async getAll(@Req() req, @ParsedRequest() crudReq: CrudRequest) {
        return this.service.getManyUsers(crudReq);
    }
}
