import * as fs from 'fs';
import {join} from 'path';

import {api as entitiesApi} from './entities';

let postgres;

const relativeDSPath = '/../../config/datasources/postgres-local.json';
const fullPathV1 = join(__dirname, relativeDSPath);
const fullPathV2 = join(__dirname, '..', relativeDSPath);

const dsConfigPath = fs.existsSync(fullPathV1) ? fullPathV1 : fullPathV2;

if (fs.existsSync(dsConfigPath)) {
    postgres = fs.readFileSync(dsConfigPath);
    process.stdout.write(`PostgreSQL database configuration file: ${dsConfigPath}\n`);
}

if (!postgres) {
    const error = 'DataSources are not configured';
    process.stderr.write(`${error}\n`);
    throw new Error(error);
}

const dbTypes = [
    {name: 'postgres', conf: postgres ? JSON.parse(postgres.toString()) : {}},
];

export class DataSource {

    static getLoadLocalConfiguration(): any {
        const merged = [] as any;
        for (const i in dbTypes) {
            if (dbTypes[i]) {
                const dbType = dbTypes[i];
                merged.push(dbType.conf);
            }
        }
        return merged;
    }

    static getConnectionData(env, dbType): any {
        const dbs = DataSource.getLoadLocalConfiguration();
        for (const db of dbs) {
            if (db[env] && dbType === db[env].type) {
                db[env].entities = [
                    ...entitiesApi,
                ];
                if (!['test'].includes(env)) {
                    db[env].migrationsRun = false;
                } else {
                    delete db[env].migrations;
                }

                return db[env];
            }
        }
        const error = `Data source ${dbType} is not configured for environment: ${env}`;
        process.stderr.write(`${error}\n`);
        throw new Error(error);
    }
}