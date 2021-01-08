import {MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {CrudConfigService} from '@nestjsx/crud';

import {File, User} from '../../entities';

import {FileController, UserController, VersionController} from './controllers';
import {Auth} from './middlewares';
import {FileService, SessionService, UserService, VersionService} from './services';

CrudConfigService.load({
    query: {limit: 100000, cache: 2000},
    params: {},
    routes: {
        replaceOneBase: {allowParamsOverride: true},
        deleteOneBase: {returnDeleted: true},
    },
});

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            File,
        ]),
    ],
    providers: [
        UserService,
        VersionService,
        SessionService,
        FileService,
    ],
    controllers: [
        UserController,
        VersionController,
        FileController,
    ],
})
export class ApiModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {
        consumer.apply(Auth)
            .forRoutes(
                {path: '/api/users/current', method: RequestMethod.GET},
                {path: '/api/users/signout', method: RequestMethod.POST},
                {path: '/api/users/', method: RequestMethod.GET},
                {path: '/api/users/:id', method: RequestMethod.PATCH},
                {path: '/api/users/:id', method: RequestMethod.DELETE},
            );
    }
}
