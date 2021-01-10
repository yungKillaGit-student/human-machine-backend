import {getConnection} from 'typeorm';

import config from '../configuration';
import {User} from '../entities';
import {Role} from '../entities/role';
import {Logger} from '../utils';

interface IUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
  pinCode: string;
}

export const checkDefaultData = async () => {
    await DefaultData.init();
};

class DefaultData {
    static async init() {
        await DefaultData.initRoles();
        const defaultAdminUser: IUser = {
            email: config.userSettings.defaultLogin,
            password: config.userSettings.defaultPassword,
            firstName: config.userSettings.defaultFirstName,
            lastName: config.userSettings.defaultLastName,
            country: config.userSettings.defaultCountry,
            pinCode: config.userSettings.defaultPinCode,
        };
        await DefaultData.initUser(defaultAdminUser, 'default admin user');
    }

    static async initRoles(): Promise<void> {
        Logger.info('Create default roles');

        const defaultRoles = ['Experts', 'Competitors'];

        await getConnection().transaction(async manager => {
            const existingRoles = await manager.find(Role);
            const existingRoleNames = existingRoles.map(x => x.name);
            const areAllRolesExist = defaultRoles.every(roleName => existingRoleNames.includes(roleName));
            if (existingRoles.length === defaultRoles.length && areAllRolesExist) {
                Logger.info('Creation of default roles is finished');
                return;
            } else {
                defaultRoles.forEach(roleName => {
                    try {
                        const role = new Role();
                        role.name = roleName;
                        manager.save(Role, role);
                    } catch (err) {
                        throw new Error(err);
                    }
                });
            }
        });

        Logger.info('Creation of default roles is finished');
    }

    static async initUser(defaultUser: Partial<IUser>, message: string): Promise<void> {
        Logger.info(`Create default ${message}`);

        const {
            email, password, firstName, lastName, country, pinCode,
        } = defaultUser;
        if (!email || !password || !firstName || !lastName || !country) {
            throw new Error('Check config. Not all necessary parameters are set');
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
            user.firstName = firstName;
            user.lastName = lastName;
            user.country = country;
            user.pinCode = pinCode;

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
