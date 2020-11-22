import {Module} from '@nestjs/common';
import {Controller, Get} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';

import {version} from '../../package.json';
import config from '../configuration';

import {ApiModule} from './api';
@Controller()
export class MainController {
    constructor() {}

    @Get()
    get() {
        return {version};
    }
}
const imports = [
    TypeOrmModule.forRoot(config.dataSource.connectionSettings),
    ConfigModule.forRoot({
        envFilePath: config.envPath,
        isGlobal: true,
    }),
    ApiModule,
];

@Module({
    imports,
    exports: [TypeOrmModule],
    controllers: [MainController],
})
export class MainModule {
}
