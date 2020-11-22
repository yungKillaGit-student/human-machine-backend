import {HttpStatus} from '@nestjs/common';
import {Response} from 'light-my-request';

import config from '../../src/configuration';
import {User} from '../../src/entities';
import {ErrorUtils, ExceptionBuilder, Guid} from '../../src/utils';
import {generatePassword, generateRandomString, getTokenFromCookie, wrapHost} from '../utils';

import {TestHelper} from './test-helper';

export class TestFactory {
    helper: TestHelper;

    constructor(helper: TestHelper) {
        this.helper = helper;
    }

    private parseResponse(expectedResponse: number, {statusCode, payload}: Partial<Response>) {
        if (statusCode !== expectedResponse) {
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST, {statusCode, payload});
        }
        return JSON.parse(payload);
    }

    private parseCreatedResponse(response: Partial<Response>) {
        return this.parseResponse(HttpStatus.CREATED, response);
    }

    private parseOkResponse(response: Partial<Response>) {
        return this.parseResponse(HttpStatus.OK, response);
    }

    private parseAcceptedResponse(response: Partial<Response>) {
        return this.parseResponse(HttpStatus.ACCEPTED, response);
    }

    private async get(
        endpoint: string,
        relations: string[],
        id: string,
        referer = config.url,
        email = TestHelper.defaultEmail,
    ) {
        const response = await this.helper.get(
            `/api/${endpoint}/${id}?join=${relations.join('&join=')}`,
            email,
            {referer: wrapHost(referer)},
        );
        return this.parseOkResponse(response);
    }

    async signInUser(request: Partial<User>, referer = config.url) {
        const response = await this.helper.post('/api/users/signin', {email: request.email, password: request.password}, null, {referer});
        const result = this.parseAcceptedResponse(response);
        const token = getTokenFromCookie(response.headers);
        TestHelper.rememberToken(result.email, token);
        return result;
    }
}
