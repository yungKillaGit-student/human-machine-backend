import {join} from 'path';

import {HttpStatus} from '@nestjs/common';
import {NestFastifyApplication} from '@nestjs/platform-fastify';
import * as chai from 'chai';
import {copy} from 'fs-extra';
import {Response} from 'light-my-request';
import {EntityManager, getManager} from 'typeorm';

import {boot} from '../../src/boot';
import {bootstrap} from '../../src/bootstrap';
import config from '../../src/configuration';
import {
    Directory, ErrorMessages, ErrorUtils, ExceptionBuilder, Logger, TestErrorUtils,
} from '../../src/utils';
import {getTokenFromCookie} from '../utils';

const {userSettings: {defaultLogin, defaultPassword}, storageDirectory} = config;

let server: NestFastifyApplication & {isInitialized?: boolean};
let manager: EntityManager;
const logger = Logger.getLogger('TestHelper');

chai.should();

export class TestHelper {

    static accessTokens: {[key: string]: string};

    static defaultEmail: string;

    dir: Directory;

    get server() {
        return server;
    }

    get manager(): EntityManager {
        return manager;
    }

    constructor() {
        before(async () => this.startApp());
    }

    private getToken(userEmail = TestHelper.defaultEmail): string {
        if (!TestHelper.accessTokens || !TestHelper.accessTokens[userEmail]) {
            return '';
        }
        return TestHelper.accessTokens[userEmail];
    }

    static rememberToken(userEmail: string, accessToken: string) {
        if (!TestHelper.accessTokens) {
            TestHelper.defaultEmail = userEmail;
            TestHelper.accessTokens = {};
        }
        TestHelper.accessTokens[userEmail] = accessToken;
    }

    private async initTokens() {
        const defaultUser = {email: defaultLogin, password: defaultPassword};
        if (!defaultUser.email || !defaultUser.password) {
            TestErrorUtils.throwExceptionWithCode(HttpStatus.UNAUTHORIZED, ErrorMessages.NO_DEFAULT_USER);
        }
        await this.signIn(defaultUser.email, defaultUser.password);
    }

    signIn = async (email: string, password: string, referer?: any): Promise<void> => {
        const {headers, statusCode, payload} = await this.post('/api/users/signin', {email: email, password: password}, null, referer);
        if (statusCode === HttpStatus.ACCEPTED) {
            const token = getTokenFromCookie(headers);
            if (!token) {
                ErrorUtils.throwHttpException(ExceptionBuilder.UNAUTHORIZED);
            } else {
                TestHelper.rememberToken(email, token);
            }
        } else {
            const body = JSON.parse(payload);
            TestErrorUtils.throwExceptionWithCode(statusCode, body.message, body.parameters);
        }
    };

    get = (url: string, email?: string, headers?: any): Promise<Response> => {
        const token = this.getToken(email);
        return this.server.inject({
            method: 'GET',
            url,
            headers: {...{cookie: token ? `token=${token}` : '', referer: config.url}, ...headers},
        });
    };

    post = (url: string, content?: any, email?: string, headers?: any): Promise<Response> => {
        const token = this.getToken(email);
        return this.server.inject({
            method: 'POST',
            url,
            headers: {...{cookie: token ? `token=${token}` : '', referer: config.url}, ...headers},
            payload: content,
        });
    };

    postUpload = (url: string, form: any, email?: string): Promise<Response> => {
        const token = this.getToken(email);
        return this.server.inject({
            method: 'POST',
            url,
            headers: {...{cookie: token ? `token=${token}` : '', referer: config.url}, ...form.getHeaders()},
            payload: form,
        });
    };

    put = (url: string, content: any, email?: string, headers?: any): Promise<Response> => {
        const token = this.getToken(email);
        return this.server.inject({
            method: 'PUT',
            url,
            headers: {...{cookie: token ? `token=${token}` : '', referer: config.url}, ...headers},
            payload: content,
        });
    };

    patch = (url: string, content: any, email?: string, headers?: any): Promise<Response> => {
        const token = this.getToken(email);
        return this.server.inject({
            method: 'PATCH',
            url,
            headers: {...{cookie: token ? `token=${token}` : '', referer: config.url}, ...headers},
            payload: content,
        });
    };

    del = (url: string, email?: string, headers?: any): Promise<Response> => {
        const token = this.getToken(email);
        return this.server.inject({
            method: 'DELETE',
            url,
            headers: {...{cookie: token ? `token=${token}` : '', referer: config.url}, ...headers},
        });
    };

    private async startApp() {
        try {
            if (server && server.isInitialized) {
                if (server) {
                    await boot();
                }
                if (this.dir) {
                    await this.dir.remove();
                }
            } else {
                server = await bootstrap();
                manager = getManager();
                await this.initTokens();
            }
        } catch (ex) {
            logger.error(ex.message || ex, 'Test helper startApp failed');
            throw ex;
        }
    }
}
