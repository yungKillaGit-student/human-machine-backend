import {Logger} from '../utils';

export const runMigrations = async () => {
    if (process.env.NODE_ENV == 'test') {
        return;
    }
    Logger.info('Running migrations...');
    await import('../../bin/migrations/run-migrations');
    Logger.info('Migrations created successfully');
};
