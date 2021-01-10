import {join} from 'path';

import * as dotenv from 'dotenv';
import {merge} from 'lodash';

import {validate} from '../utils/utils';

import {DataSource} from './datasources';
import {configs, env, logLevels, rootPath} from './server';
import {IConfig, schema} from './server-schema';

const section = configs[env];

if (!section) {
    process.stdout.write(`Config defaults will be used: config section "${env}" doesn't exist\n`);
}

dotenv.config();

const commonSection = configs.common;

const defaults = {
    host: 'http://127.0.0.1',
    httpPort: 3000,
    pathPrefix: '',
    assetsDirectory: './assets',
    storageDirectory: './static',
    rootPath: rootPath,
    cacheResponse: false,
    dataSource: {
        dbType: 'postgres',
        connectionSettings: {},
    },
};

const envs = process.env;

const config: IConfig = merge({}, defaults, commonSection || {}, section || {});
const dbType = envs.DB ? envs.DB : config.dataSource.dbType;

if (!envs.DB) {
    envs.DB = dbType;
}

const dataSource = DataSource.getConnectionData(env, dbType);

config.dataSource = {dbType, connectionSettings: dataSource};

config.httpPort = Number.parseInt(envs.PORT) || config.httpPort;
config.host = envs.HOST || config.host;
config.jwtSecret = envs.JWT_SECRET || config.jwtSecret;
config.logLevel = (envs.LOG_LEVEL || config.logLevel) as typeof logLevels[number];
if (env.includes('test')) {
    config.shouldSkipTests = !!envs.SHOULD_SKIP || false;
}

config.userSettings.defaultLogin = envs.DEFAULT_USER_LOGIN || config.userSettings.defaultLogin;
config.userSettings.defaultPassword = envs.DEFAULT_USER_PASSWORD || config.userSettings.defaultPassword;
config.userSettings.defaultFirstName = envs.DEFAULT_USER_FIRST_NAME;
config.userSettings.defaultLastName = envs.DEFAULT_USER_LAST_NAME;
config.userSettings.defaultCountry = envs.DEFAULT_USER_COUNTRY;
config.userSettings.defaultPinCode = envs.DEFAULT_USER_PIN_CODE;

const dbConn = config.dataSource.connectionSettings;
dbConn.username = envs.PG_USER || dbConn.username;
dbConn.password = envs.PG_PASS || dbConn.password;
dbConn.database = envs.PG_NAME || dbConn.database;
dbConn.host = envs.PG_HOST || dbConn.host;
dbConn.port = Number.parseInt(envs.PG_PORT) || dbConn.port;

Object.assign(config, {
    env,
    envPath: join(`${config.rootPath}/.env`),
    host: `http://${config.host}:${config.httpPort}`,
    assetsDirectory: join(config.assetsDirectory),
    storageDirectory: join(config.storageDirectory),
    hostName: config.host,
    hostPort: config.httpPort,
});

const validation = validate(config, schema);

if (!validation.valid) {
    process.stderr.write(`Invalid config: ${validation.error}\n`);
    process.exit(1);
}

export default config;
