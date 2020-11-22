import {URL} from 'url';

import {EntityManager, IsNull, getConnection} from 'typeorm';

import config from '../configuration';
import {User} from '../entities';
import {Guid, Logger} from '../utils';

interface IUser {
  email: string; password: string;
}

export const checkDefaultData = async () => {
    await DefaultData.init();
};

class DefaultData {
    static async init() {
        const defaultAdminUser: IUser = {
            email: config.userSettings.defaultLogin,
            password: config.userSettings.defaultPassword,
        };
        await DefaultData.initUser(defaultAdminUser, 'default admin user');
    }

    static async initUser(defaultUser: Partial<IUser>, message: string): Promise<void> {
        Logger.info(`Create default ${message}`);

        const {email, password} = defaultUser;
        if (!email || !password) {
            throw new Error('Email or password is not set');
        }

        await getConnection().transaction(async manager => {
            const existingUser = await manager.findOne(User, {where: {email: email.toLowerCase()}});
            if (existingUser) {
                Logger.info(`Creation of default ${message} is finished`);
                return;
            }

            const user = new User();
            user.password = password;
            user.email = email.toLowerCase();

            try {
                await manager.save(User, user);
            } catch (err) {
                if (err.code && err.code === '23505') {
                    // await manager.update(User, {email: email.toLowerCase()}, user);
                } else {
                    throw new Error(err);
                }
            }
        });

        Logger.info(`Creation of default ${message} is finished`);
    }
}
