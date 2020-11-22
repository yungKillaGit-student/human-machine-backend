import {
    appendFileSync,
    existsSync,
    readFileSync,
    unlinkSync,
} from 'fs';
import {join} from 'path';

const {DB: dbType = 'postgres', NODE_ENV: env} = process.env;

export const rootProjectDir = join(__dirname, __dirname.includes('dist') ? '../../../' : '../../');

// get current environment for chosen DB
const dataSourceFile = join(`${rootProjectDir}/config/datasources/${dbType}-local.json`);

const dataSourceData = readFileSync(dataSourceFile);
const dataSource = JSON.parse(dataSourceData.toString());

if (!dataSource[process.env.NODE_ENV]) {
    process.stderr.write(`Wrong config files, environment #${env} is not configured.\n`);
    process.exit(0);
}

const config = dataSource[process.env.NODE_ENV];

const migrationConfig = {
    driver: dbType,
    type: dbType,
    host: config.host,
    database: config.database,
    username: config.username,
    port: config.port,
    password: config.password,
    migrations: config.migrations,
    cli: config.cli,
    logging: false,
};

// prepare migration config file
const migrationConfigFile = join(`${rootProjectDir}/migrations/datasource.json`);

export const prepare = () => {
    if (existsSync(migrationConfigFile)) {
        unlinkSync(migrationConfigFile);
    }

    // create new config with actual DB connection data
    appendFileSync(migrationConfigFile, JSON.stringify(migrationConfig));
};
