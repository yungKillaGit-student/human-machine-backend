import {EntitySchema, getConnection} from 'typeorm';

import config from '../configuration';
import {Directory, Logger} from '../utils';

export const truncate = async () => {

    const dbConn = getConnection();

    const isConnected = dbConn.isConnected;
    const dbOptions = dbConn.options;

    if (!isConnected) {
        Logger.info(`Connection to the database ${dbOptions.type} is failed`);
    }

    if (config.cleanDBsOnStart) {
        // clear files
        const dir = new Directory(config.storageDirectory);
        await dir.clear();

        // clear database
        const entities = dbOptions.entities as EntitySchema[];

        Logger.info(`Truncating data from the database ${dbOptions.type}`);
        const keepData: string[] = [];

        await dbConn.transaction(async transactionalEntityManager => {
            for (const entity of entities) {
                const metadata = dbConn.getMetadata(entity);
                const {tableName, schema = 'public'} = metadata;

                if (!keepData.includes(tableName)) {
                    await transactionalEntityManager.query(`TRUNCATE TABLE ${schema}.${tableName} RESTART IDENTITY CASCADE`);
                }
            }
        });

        Logger.info(`Truncating is finished for the database ${dbOptions.type}`);
    }
};
