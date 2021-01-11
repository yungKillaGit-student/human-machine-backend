import {MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {CrudConfigService} from '@nestjsx/crud';

import {
    Document, Event, File, Role, User,
} from '../../entities';

import {EventController, FileController, UserController, VersionController} from './controllers';
import {DocumentController} from './controllers/document';
import {Auth} from './middlewares';
import {
    DocumentService,
    EventService,
    FileService,
    SessionService,
    UserService,
    VersionService,
} from './services';

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
            Role,
            Event,
            Document,
        ]),
    ],
    providers: [
        UserService,
        VersionService,
        SessionService,
        FileService,
        EventService,
        DocumentService,
    ],
    controllers: [
        UserController,
        VersionController,
        FileController,
        EventController,
        DocumentController,
    ],
})
export class ApiModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {
        consumer.apply(Auth)
            .forRoutes(
                {path: '/api/users/current', method: RequestMethod.GET},
                {path: '/api/users/signout', method: RequestMethod.POST},
                {path: '/api/users/', method: RequestMethod.GET},
                {path: '/api/users/:id', method: RequestMethod.DELETE},
                EventController,
                DocumentController,
            );
    }
}
