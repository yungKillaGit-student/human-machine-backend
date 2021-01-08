import {HttpStatus} from '@nestjs/common';
import {assert} from 'chai';

import {FileUploadResponseDto} from '../../../../src/modules/api/interfaces';
import {ErrorMessages} from '../../../../src/utils';
import {TestHelper} from '../../test-helper';

import {createForm, createTestFile} from './test-files-utils';

describe('FILE :: BASIC OPERATIONS', () => {
    const {get, post} = new TestHelper();
    const fileUploadResponseDtoKeys = ['name', 'height', 'width'];
    const testFile = createTestFile('test.png');
    const unsupportedFile = createTestFile('test.txt');

    it('POST /api/files/upload should upload only images', async () => {
        const form = createForm(unsupportedFile);
        const {statusCode} = await post('/api/files/upload', form, null, form.getHeaders());
        assert.equal(statusCode, HttpStatus.BAD_REQUEST, ErrorMessages.BAD_REQUEST_FILE_WRONG_DATA);
    });

    it('POST /api/files/upload should create a new file', async () => {
        const form = createForm(testFile);
        const {statusCode, payload} = await post('/api/files/upload', form, null, form.getHeaders());
        const body = JSON.parse(payload) as FileUploadResponseDto;
        assert.equal(statusCode, HttpStatus.CREATED, 'Wrong response HTTP code');
        assert.containsAllKeys(body, fileUploadResponseDtoKeys, 'Response doesn\'t have all the keys');
    });

    it('GET /api/files/{name} should return created file', async () => {
        const {statusCode, rawPayload: image, headers} = await get(`/api/files/${testFile.name}`, null);
        assert.equal(statusCode, HttpStatus.OK, 'Wrong response HTTP code');
        assert.equal(headers['content-type'], testFile.mime, 'Content types are not equal');
        assert.equal(image.length, testFile.file.length, 'Image contents are not equal');
    });

    it('GET /api/files/{wrong-name} should return an error', async () => {
        const {statusCode, payload} = await get(`/api/files/${+new Date()}-wrong-${testFile.name}`, null);
        const {message} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.NOT_FOUND, 'Wrong error code');
        assert.equal(message, ErrorMessages.OBJECT_NOT_FOUND, 'Wrong error message');
    });
});
