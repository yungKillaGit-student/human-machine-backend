import {join} from 'path';

import {NestFactory} from '@nestjs/core';
import {FastifyAdapter, NestFastifyApplication} from '@nestjs/platform-fastify';
import * as fileUpload from 'fastify-file-upload';
import * as helmet from 'helmet';

import {version} from '../package.json';

import {boot} from './boot';
import config from './configuration';
import {AllExceptionsFilter} from './filters';
import {LoggingInterceptor, RefreshTokenInterceptor} from './interceptors';
import {MainModule} from './modules';
import {SessionService} from './modules/api/services';
import {Logger, Swagger, getAppVersion} from './utils';

const {host, httpPort} = config;

export async function bootstrap(): Promise<any> {
    const app = await NestFactory.create<NestFastifyApplication>(
        MainModule,
        new FastifyAdapter(),
    );

    await Logger.init(app);

    app.useGlobalInterceptors(new LoggingInterceptor());
    app.useGlobalInterceptors(new RefreshTokenInterceptor(app.get(SessionService)));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.use(helmet({contentSecurityPolicy: false}));
    app.enableCors({
        origin: '*',
        allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    });
    await app.register(fileUpload);

    if (config.enableDocs) {
        Swagger.init(app, {
            title: 'Human-Machine',
            description: 'Human-Machine',
            version: getAppVersion(version),
        });
    }

    app.useStaticAssets({
        root: join(config.rootPath, config.storageDirectory),
        prefix: `/${config.storageDirectory}`,
    });

    await boot();

    app.enableShutdownHooks();
    await app.listen(httpPort, '0.0.0.0');

    Logger.info(`Listening on http://127.0.0.1:${config.httpPort}`);
    Logger.info(`Started with ${host} server name`);
    if (config.enableDocs) {
        Logger.info(`API documentation is here ${host}/swagger`);
    }

    return app;
}
