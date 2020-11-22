import {execSync} from 'child_process';
import {writeFileSync} from 'fs';
import {join} from 'path';

const migrationName = process.argv.slice(2)[0].trim();
if (!migrationName) {
    throw new Error('Migration name should be set as an argument');
}

const folderPath = join(`${__dirname}/../../`);
const crossEnv = join(`${folderPath}/node_modules/.bin/cross-env`);
const tsNode = join(`${folderPath}/node_modules/.bin/ts-node`);
const typeorm = join(`${folderPath}/node_modules/typeorm/cli.js`);
const migrationsDirPath = 'migrations';

process.stdout.write('Creating migration...\n');

const stdout = execSync(`${crossEnv} DB=postgres ${tsNode} ${typeorm} migration:create -d ${migrationsDirPath} -n ${migrationName}`).toString('utf-8');
process.stdout.write(`${stdout}\n`);

const timestamp = stdout.match(/\/(\d+)-(.*)\.ts/)[1];
if (!timestamp) {
    throw new Error('Could not extract timestamp from name of the migration file');
}

process.stdout.write(`Timestamp: ${timestamp} ms\n`);

writeFileSync(join(folderPath, 'migrations/VERSION'), timestamp, 'utf8');

process.stdout.write('VERSION file is updated\n');
