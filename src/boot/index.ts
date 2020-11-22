import {runMigrations} from './0_run-migrations';
import {truncate} from './1_truncate_data';
import {checkDefaultData} from './2_check_default_data';

export const boot = async () => {
    await runMigrations();
    await truncate();
    await checkDefaultData();
};
