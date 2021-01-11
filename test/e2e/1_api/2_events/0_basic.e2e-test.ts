import {HttpStatus} from '@nestjs/common';
import {assert} from 'chai';
import moment = require('moment');

import {ErrorMessages, Guid, sleep} from '../../../../src/utils';
import {TestFactory} from '../../test-factory';
import {TestHelper} from '../../test-helper';

describe('EVENT :: BASIC CRUD OPERATIONS', () => {
    const helper = new TestHelper();
    const factory = new TestFactory(helper);
    const {get, post, patch, del} = helper;

    const endpoint = 'events';
    const events = [];

    const dateFormat = 'DD/MM/YYYY';

    const testEvent = {
        cOneDate: moment('03/12/2020', dateFormat),
        cPlusOneDate: moment('05/12/2020', dateFormat),
        finishDate: moment('06/12/2020', dateFormat),
        startDate: moment('01/12/2020', dateFormat),
        title: 'test-event',
    };

    const eventKeys = [
        'cOneDate', 'cPlusOneDate', 'finishDate', 'startDate', 'title',
    ];

    it('GET /api/events/[unknown-uid] should return 404 error', async () => {
        const unknownUid = Guid.new();
        const {statusCode} = await get(`/api/${endpoint}/${unknownUid}`, TestHelper.defaultEmail);
        assert.equal(statusCode, HttpStatus.NOT_FOUND, 'Wrong Http code returned');
    });

    it('GET /api/events should return empty array', async () => {
        const {statusCode, payload} = await get(`/api/${endpoint}`, TestHelper.defaultEmail);
        assert.equal(statusCode, HttpStatus.OK, 'Wrong Http code returned');
        const body = JSON.parse(payload);
        assert.deepEqual(body, [], 'Returned not empty array');
    });

    it('POST /api/events should return err because sent incorrect data', async () => {
        const {statusCode, payload} = await post(`/api/${endpoint}`, {foo: 2}, TestHelper.defaultEmail);
        assert.equal(statusCode, HttpStatus.BAD_REQUEST, payload);
    });

    it('POST /api/events should add new entities to DB', async () => {
        const firstResponse = await post(`/api/${endpoint}`, testEvent, TestHelper.defaultEmail);
        const firstResponseBody = JSON.parse(firstResponse.payload);
        assert.equal(firstResponse.statusCode, HttpStatus.CREATED, 'Wrong code');
        assert.containsAllKeys(firstResponseBody, eventKeys, 'Response doesn\'t have all the keys');
        events.push(firstResponseBody);

        const secondEvent = {...testEvent};
        secondEvent.title = 'second-event';
        const secondResponse = await post(`/api/${endpoint}`, secondEvent, TestHelper.defaultEmail);
        const secondResponseBody = JSON.parse(secondResponse.payload);
        assert.equal(secondResponse.statusCode, HttpStatus.CREATED, 'Wrong code');
        assert.containsAllKeys(secondResponseBody, eventKeys, 'Response doesn\'t have all the keys');
        events.push(secondResponseBody);
    });

    it('POST /api/events should return an error with already existed name', async () => {
        const {statusCode, payload} = await post(`/api/${endpoint}`, testEvent, TestHelper.defaultEmail);
        const {message} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.CONFLICT, 'wrong response HTTP code');
        assert.equal(message, ErrorMessages.CONFLICT_OBJECT_ALREADY_EXISTS, 'wrong error message');
    });

    it('GET /api/events should return lists with test data', async () => {
        const {statusCode, payload} = await get(`/api/${endpoint}`, TestHelper.defaultEmail);
        const body = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.OK, 'wrong response HTTP code');
        assert.deepEqual(body.length, 2, 'Returned not same list');
    });

    it('PATCH /api/events/:id should return an error with already busy name', async () => {
        const event = events[0];
        const newEvent = {title: events[1].title};
        const {statusCode, payload} = await patch(`/api/${endpoint}/${event.id}`, newEvent, TestHelper.defaultEmail);
        const {message} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.CONFLICT, 'wrong response HTTP code');
        assert.equal(message, ErrorMessages.CONFLICT_OBJECT_ALREADY_EXISTS, 'wrong error message');
    });

    it('PATCH /api/events/:id should update event', async () => {
        const event = events[0];
        const newEvent = {title: 'new-title'};

        await sleep(200);
        const {statusCode, payload} = await patch(`/api/${endpoint}/${event.id}`, newEvent, TestHelper.defaultEmail);
        assert.equal(statusCode, HttpStatus.OK, 'wrong response HTTP code');
        const body = JSON.parse(payload);
        const updatedEvent = events[0] = body.newObject;
        assert.equal(newEvent.title === updatedEvent.title, true, 'name not updated');
    });

    it('DELETE /api/events/:id should delete event', async () => {
        const event = events[0];
        const {statusCode} = await del(`/api/${endpoint}/${event.id}`, TestHelper.defaultEmail);
        assert.equal(statusCode, HttpStatus.OK, 'wrong response HTTP code');
    });
});
