import {HttpStatus} from '@nestjs/common';
import {assert} from 'chai';

import {ErrorMessages, Guid, sleep} from '../../../../src/utils';
import {TestFactory} from '../../test-factory';
import {TestHelper} from '../../test-helper';

describe('DOCUMENT :: BASIC CRUD OPERATIONS', () => {
    const helper = new TestHelper();
    const factory = new TestFactory(helper);
    const {get, post, patch, del} = helper;

    const endpoint = 'documents';
    const documents = [];

    const testDocument = {
        title: 'test-document',
        day: 'c-1',
        content: 'test-content',
        roleName: 'Experts',
    };

    const documentKeys = [
        'title', 'day', 'content', 'isSigned', 'roleId',
    ];

    it('GET /api/documents/[unknown-uid] should return 404 error', async () => {
        const unknownUid = Guid.new();
        const {statusCode} = await get(`/api/${endpoint}/${unknownUid}`, TestHelper.defaultEmail);
        assert.equal(statusCode, HttpStatus.NOT_FOUND, 'Wrong Http code returned');
    });

    it('GET /api/documents should return empty array', async () => {
        const {statusCode, payload} = await get(`/api/${endpoint}`, TestHelper.defaultEmail);
        assert.equal(statusCode, HttpStatus.OK, 'Wrong Http code returned');
        const body = JSON.parse(payload);
        assert.deepEqual(body, [], 'Returned not empty array');
    });

    it('POST /api/documents should return err because sent incorrect data', async () => {
        const {statusCode, payload} = await post(`/api/${endpoint}`, {foo: 2}, TestHelper.defaultEmail);
        assert.equal(statusCode, HttpStatus.BAD_REQUEST, payload);
    });

    it('POST /api/documents should add new entities to DB', async () => {
        const firstResponse = await post(`/api/${endpoint}`, testDocument, TestHelper.defaultEmail);
        const firstResponseBody = JSON.parse(firstResponse.payload);
        assert.equal(firstResponse.statusCode, HttpStatus.CREATED, 'Wrong code');
        assert.containsAllKeys(firstResponseBody, documentKeys, 'Response doesn\'t have all the keys');
        documents.push(firstResponseBody);

        const secondDocument = {...testDocument};
        secondDocument.title = 'second-document';
        const secondResponse = await post(`/api/${endpoint}`, secondDocument, TestHelper.defaultEmail);
        const secondResponseBody = JSON.parse(secondResponse.payload);
        assert.equal(secondResponse.statusCode, HttpStatus.CREATED, 'Wrong code');
        assert.containsAllKeys(secondResponseBody, documentKeys, 'Response doesn\'t have all the keys');
        documents.push(secondResponseBody);
    });

    it('POST /api/documents should return an error with already existed name', async () => {
        const {statusCode, payload} = await post(`/api/${endpoint}`, testDocument, TestHelper.defaultEmail);
        const {message} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.CONFLICT, 'wrong response HTTP code');
        assert.equal(message, ErrorMessages.CONFLICT_OBJECT_ALREADY_EXISTS, 'wrong error message');
    });

    it('POST /api/documents should return an error with non existed role name', async () => {
        const createDto = {...testDocument};
        createDto.title = 'new-test';
        createDto.roleName = 'non-existed-role';
        const {statusCode, payload} = await post(`/api/${endpoint}`, createDto, TestHelper.defaultEmail);
        const {message} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.NOT_FOUND, 'wrong response HTTP code');
        assert.equal(message, ErrorMessages.OBJECT_NOT_FOUND, 'wrong error message');
    });

    it('GET /api/documents should return lists with test data', async () => {
        const {statusCode, payload} = await get(`/api/${endpoint}`, TestHelper.defaultEmail);
        const body = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.OK, 'wrong response HTTP code');
        assert.deepEqual(body.length, 2, 'Returned not same list');
    });

    it('PATCH /api/documents/:id should return an error with already busy name', async () => {
        const document = documents[0];
        const updateDto = {title: documents[1].title};
        const {statusCode, payload} = await patch(`/api/${endpoint}/${document.id}`, updateDto, TestHelper.defaultEmail);
        const {message} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.CONFLICT, 'wrong response HTTP code');
        assert.equal(message, ErrorMessages.CONFLICT_OBJECT_ALREADY_EXISTS, 'wrong error message');
    });

    it('PATCH /api/documents/:id should update document', async () => {
        const firstDocument = documents[0];
        const newDocument = {title: 'new-title'};

        await sleep(200);
        const {statusCode, payload} = await patch(`/api/${endpoint}/${firstDocument.id}`, newDocument, TestHelper.defaultEmail);
        assert.equal(statusCode, HttpStatus.OK, 'wrong response HTTP code');
        const body = JSON.parse(payload);
        const updatedEvent = documents[0] = body.newObject;
        assert.equal(newDocument.title === updatedEvent.title, true, 'name not updated');
    });

    it('DELETE /api/documents/:id should delete document', async () => {
        const document = documents[0];
        const {statusCode} = await del(`/api/${endpoint}/${document.id}`, TestHelper.defaultEmail);
        assert.equal(statusCode, HttpStatus.OK, 'wrong response HTTP code');
    });
});
