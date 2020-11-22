import {execSync} from 'child_process';
import {join} from 'path';

import {prepare, rootProjectDir} from './prepare-migrations-config';

prepare();

const crossEnvPath = join(`${rootProjectDir}/node_modules/.bin/cross-env`);
const execPath = join(`${rootProjectDir}/node_modules/.bin/ts-node`);
const migrationsCliPath = join(`${rootProjectDir}/node_modules/typeorm/cli.js`);
const configPath = 'migrations/datasource.json';

const stdout = execSync(`${crossEnvPath} DB=postgres ${execPath} ${migrationsCliPath} migration:run -t=false -f ${configPath}`, {maxBuffer: 3000 * 3000}).toString('utf-8');
if (process.env.NODE_ENV === 'dev') {
    process.stdout.write(`${stdout}\n`);
}
