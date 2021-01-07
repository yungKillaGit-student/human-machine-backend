import {MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {CrudConfigService} from '@nestjsx/crud';

import {User} from '../../entities';

import {UserController, VersionController} from './controllers';
import {Auth} from './middlewares';
import {SessionService, UserService, VersionService} from './services';

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
        ]),
    ],
    providers: [
        UserService,
        VersionService,
        SessionService,
    ],
    controllers: [
        UserController,
        VersionController,
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
