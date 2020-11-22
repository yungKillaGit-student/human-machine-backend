import {existsSync, readFileSync} from 'fs';
import {join} from 'path';

const relativeConfigPath = '/../../config/config-local.json';
const fullPathV1 = join(__dirname, relativeConfigPath);
const fullPathV2 = join(__dirname, '..', relativeConfigPath);

const configFilePath = existsSync(fullPathV1) ? fullPathV1 : fullPathV2;
const rootPath = existsSync(fullPathV1) ? join(`${__dirname}/../../`) : join(`${__dirname}/../../../`);

let configs;

const logLevels = [
    'error',
    'warn',
    'info',
    'debug',
    'silly',
] as const;

const environments = [
    'dev',
    'test',
] as const;

const defaultEnv = 'dev';

let env = (process.env.NODE_ENV || process.argv[2] || defaultEnv).toLowerCase() as typeof environments[number];
process.stdout.write(`Defined environment: ${env}\n`);

if (existsSync(configFilePath)) {
    configs = JSON.parse(readFileSync(configFilePath).toString());
    process.stdout.write(`Configuration file: ${configFilePath}\n`);
} else {
    const error = `Configuration file is missing: ${configFilePath}`;
    process.stderr.write(`${error}\n`);
    throw new Error(error);
}

if (!environments.includes(env)) {
    process.stdout.write(`Set environment to default "${defaultEnv}": unknown environment "${env}"\n`);
    env = defaultEnv;
}

if (process.env.NODE_ENV !== env) {
    process.env.NODE_ENV = env;
}

export {
    logLevels, environments, env, configs, rootPath,
};
