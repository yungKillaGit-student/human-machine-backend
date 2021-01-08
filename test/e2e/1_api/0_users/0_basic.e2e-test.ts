import {HttpStatus} from '@nestjs/common';
import {assert} from 'chai';
import {parse} from 'cookie';

import {ErrorMessages} from '../../../../src/utils';
import {generatePassword, getTokenFromCookie} from '../../../utils';
import {TestHelper} from '../../test-helper';

describe('USER :: BASIC OPERATIONS', () => {

    const helper = new TestHelper();
    const {get, post, patch, del} = helper;

    const userResponseDtoKeys = ['id', 'email'];

    const name = `test-${+new Date()}`;
    const testUser = {
        password: `test-${generatePassword()}`,
        email: `${name}@example.com`,
        token: null,
        id: null,
        firstName: 'test-first-name',
        lastName: 'test-last-name',
        country: 'test-country',
    };
    const wrongUser = {
        email: `wrong-${name}@example.com`,
        password: 'test-wrong',
    };

    it('POST /api/users should return an error for not valid email address', async () => {
        const {password, firstName, lastName, country} = testUser;
        const email = 'abc';
        const {statusCode, payload} = await post('/api/users', {
            password, email, firstName, lastName, country, repeatedPassword: password,
        }, TestHelper.defaultEmail);
        const {message} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.BAD_REQUEST, 'Wrong code');
        assert.equal(message, ErrorMessages.BAD_REQUEST, 'Wrong message');
    });

    it('POST /api/users should create a new user', async () => {
        const {
            password, email, firstName, lastName, country,
        } = testUser;
        const {statusCode, payload} = await post('/api/users', {
            password, email, firstName, lastName, country, repeatedPassword: password,
        }, TestHelper.defaultEmail);
        const body = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.CREATED, 'Wrong code');
        assert.containsAllKeys(body, userResponseDtoKeys, 'Response doesn\'t have all the keys');
    });

    it('POST /api/users should return an error for already created user', async () => {
        const {
            password, email, firstName, lastName, country,
        } = testUser;
        const {statusCode, payload} = await post('/api/users', {
            password, email, firstName, lastName, country, repeatedPassword: password,
        }, TestHelper.defaultEmail);
        const {message} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.CONFLICT, 'Wrong code');
        assert.equal(message, ErrorMessages.CONFLICT_OBJECT_ALREADY_EXISTS, 'Wrong message');
    });

    it('POST /api/users/signin should return an error for wrong users', async () => {
        const users = [
            {email: wrongUser.email, password: wrongUser.password},
            {email: wrongUser.email, password: testUser.password},
        ];
        for (const user of users) {
            const {statusCode, payload} = await post('/api/users/signin', {email: user.email, password: user.password});
            const {message} = JSON.parse(payload);
            assert.equal(statusCode, HttpStatus.NOT_FOUND, 'Wrong code');
            assert.equal(message, ErrorMessages.OBJECT_NOT_FOUND, 'Wrong message');
        }
    });

    it('POST /api/users/signin should sign in an existent user', async () => {
        const {email, password} = testUser;
        const {statusCode, payload, headers} = await post('/api/users/signin', {email, password});
        const body = JSON.parse(payload);
        const token = getTokenFromCookie(headers);
        assert.equal(statusCode, HttpStatus.ACCEPTED, 'Wrong code');
        assert.containsAllKeys(body, userResponseDtoKeys, 'Response doesn\'t have all the keys');
        assert(token, 'Response doesn\'t have a token');
        TestHelper.rememberToken(testUser.email, token);
    });

    it('GET /api/users/current without creds should return an error', async () => {
        const {statusCode, payload} = await get('/api/users/current', wrongUser.email);
        const {message} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.UNAUTHORIZED, 'Wrong code');
        assert.equal(message, ErrorMessages.USER_UNAUTHORIZED, 'Wrong message');
    });

    it('GET /api/users/current with creds should return current user', async () => {
        const {statusCode, payload} = await get('/api/users/current', testUser.email);
        const body = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.OK, payload && 'Not OK');
        assert.containsAllKeys(body, userResponseDtoKeys, 'Response doesn\'t have all the keys');
        testUser.id = body.id;
    });

    it('POST /api/users/signout without creds should return an error', async () => {
        const {statusCode, payload} = await post('/api/users/signout', {}, wrongUser.email);
        const {message} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.UNAUTHORIZED, 'Wrong code');
        assert.equal(message, ErrorMessages.USER_UNAUTHORIZED, 'Wrong message');
    });

    it('POST /api/users/signout with creds should remove creds and return user', async () => {
        const {statusCode, payload, headers} = await post('/api/users/signout', {}, testUser.email);
        const body = JSON.parse(payload);
        const token = getTokenFromCookie(headers);
        assert.equal(statusCode, HttpStatus.ACCEPTED, payload && 'Not ACCEPTED');
        assert.containsAllKeys(body, userResponseDtoKeys, 'Response doesn\'t have all the keys');
        assert.equal(token, '', 'Response token should be empty');
        TestHelper.rememberToken(testUser.email, token);
    });

    it('POST /api/users/signout for signed out user should return an error', async () => {
        const {statusCode, payload} = await post('/api/users/signout', {}, testUser.email);
        const {message} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.UNAUTHORIZED, 'Wrong code');
        assert.equal(message, ErrorMessages.USER_UNAUTHORIZED, 'Wrong message');
    });

    it('GET /api/users/current for signed out user should return an error', async () => {
        const {statusCode, payload} = await get('/api/users/current', testUser.email);
        const {message} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.UNAUTHORIZED, 'Wrong code');
        assert.equal(message, ErrorMessages.USER_UNAUTHORIZED, 'Wrong message');
    });

    it('GET /api/users should return all users', async () => {
        const {statusCode, payload} = await get('/api/users', TestHelper.defaultEmail);
        assert.equal(statusCode, HttpStatus.OK, 'Wrong response code');
        const {data: users} = JSON.parse(payload);
        const foundUser = users.filter(user => user.email === testUser.email)[0];
        assert.containsAllKeys(foundUser, userResponseDtoKeys, 'Response doesn\'t have all the keys');
        testUser.id = foundUser.id;
    });

    it('POST /api/users/signin should sign in an existent user (after signout)', async () => {
        const {email, password} = testUser;
        const {statusCode, payload, headers} = await post('/api/users/signin', {email, password});
        const body = JSON.parse(payload);
        const sc = headers['set-cookie'];
        const cookies = parse(sc ? typeof sc === 'object' ? sc.join(' ') : `${sc}` : '');
        const {token} = cookies;
        assert.equal(statusCode, HttpStatus.ACCEPTED, 'Wrong code');
        assert.containsAllKeys(body, userResponseDtoKeys, 'Response doesn\'t have all the keys');
        assert(token, 'Response doesn\'t have a token');
        TestHelper.rememberToken(testUser.email, token);
    });

    it('PATCH /api/users/:id without creds should return an error', async () => {
        const {statusCode, payload} = await patch(`/api/users/${testUser.id}`, {newPassword: 'test-pass', repeatedPassword: 'test-pass'}, wrongUser.email);
        const {message} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.UNAUTHORIZED, 'Wrong code');
        assert.equal(message, ErrorMessages.USER_UNAUTHORIZED, 'Wrong message');
    });

    it('PATCH /api/users/:id with wrong id should return an error', async () => {
        const id = 'abc';
        const {statusCode} = await patch(`/api/users/${id}`, {newPassword: 'test-pass', repeatedPassword: 'test-pass'}, testUser.email);
        assert.equal(statusCode, HttpStatus.BAD_REQUEST, 'Wrong code');
    });

    it('PATCH /api/users/:id with creds should update user', async () => {
        const newPassword = generatePassword();
        const updateDto = {
            currentPassword: testUser.password,
            newPassword: newPassword,
            repeatedPassword: newPassword,
        };
        const {statusCode, payload} = await patch(`/api/users/${testUser.id}`, updateDto, testUser.email);
        assert.equal(statusCode, HttpStatus.OK, payload && 'OK');
        assert.equal(!!payload, true, payload && 'OK');
        testUser.password = newPassword;
    });

    it('PATCH /api/users/:id with wrong current password should return an error', async () => {
        const newPassword = generatePassword();
        const updateDto = {
            currentPassword: 'wrong-current-password',
            newPassword: newPassword,
            repeatedPassword: newPassword,
        };
        const {statusCode} = await patch(`/api/users/${testUser.id}`, updateDto, testUser.email);
        assert.equal(statusCode, HttpStatus.BAD_REQUEST, ErrorMessages.BAD_REQUEST);
        testUser.password = newPassword;
    });

    it('DELETE /api/users/delete without creds should return an error', async () => {
        const {statusCode, payload} = await del(`/api/users/${testUser.id}`, wrongUser.email);
        const {message} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.UNAUTHORIZED, 'Wrong code');
        assert.equal(message, ErrorMessages.USER_UNAUTHORIZED, 'Wrong message');
    });

    it('DELETE /api/users/:id with wrong id should return an error', async () => {
        const id = 'abc';
        const {statusCode} = await del(`/api/users/${id}`, testUser.email);
        assert.equal(statusCode, HttpStatus.BAD_REQUEST, 'Wrong code');
    });

    it('DELETE /api/users/delete with creds should delete user', async () => {
        const {statusCode, payload} = await del(`/api/users/${testUser.id}`, testUser.email);
        assert.equal(statusCode, HttpStatus.OK, payload && 'OK');
        assert.equal(!!payload, true, payload && 'OK');
    });
});
