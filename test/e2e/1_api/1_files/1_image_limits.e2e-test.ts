import {HttpStatus} from '@nestjs/common';
import {assert} from 'chai';

import config from '../../../../src/configuration';
import {FileUploadResponseDto} from '../../../../src/modules/api/interfaces';
import {ErrorMessages} from '../../../../src/utils';
import {TestHelper} from '../../test-helper';

import {createForm, createTestFile} from './test-files-utils';

describe('FILE :: IMAGE LIMITS', () => {
    const {post} = new TestHelper();

    const {maxNameLength, maxSize, maxResolution} = config.uploadSettings;
    const fileUploadResponseDtoKeys = ['name', 'height', 'width'];

    const pngFile = createTestFile('test.png');
    const jpegFile = createTestFile('test.jpg');
    const largeWeightPngFile = createTestFile('large-weight.png');
    const largeWeightJpegFile = createTestFile('large-weight.jpg');
    const longLongLongLongLongNamedFile = createTestFile('test-with-long-long-long-long-long-name.png');

    it('POST /api/files/upload should upload PNG file', async () => {
        const form = createForm(pngFile);
        const {statusCode, payload} = await post('/api/files/upload', form, null, form.getHeaders());
        const body: FileUploadResponseDto = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.CREATED, 'Wrong response HTTP code');
        assert.containsAllKeys(body, fileUploadResponseDtoKeys, 'Response doesn\'t have all the keys');
    });

    it('POST /api/files/upload should upload JPEG file', async () => {
        const form = createForm(jpegFile);
        const {statusCode, payload} = await post('/api/files/upload', form, null, form.getHeaders());
        const body: FileUploadResponseDto = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.CREATED, 'Wrong response HTTP code');
        assert.containsAllKeys(body, fileUploadResponseDtoKeys, 'Response doesn\'t have all the keys');
    });

    it('POST /api/files/upload should return an error for files with long names', async () => {
        const form = createForm(longLongLongLongLongNamedFile);
        const {statusCode, payload} = await post('/api/files/upload', form, null, form.getHeaders());
        const {message, parameters} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.BAD_REQUEST, 'Wrong error code');
        assert.equal(message, ErrorMessages.BAD_REQUEST_FILE_LARGE_NAME, 'Wrong error message');
        assert.equal(parameters.maxNameLength, maxNameLength, 'Wrong error parameters');
    });

    it('POST /api/files/upload should return an error for large size PNG file with thumbnail', async () => {
        const form = createForm(largeWeightPngFile);
        const {statusCode, payload} = await post('/api/files/upload', form, null, form.getHeaders());
        const {message, parameters} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.BAD_REQUEST, 'Wrong error code');
        assert.equal(message, ErrorMessages.BAD_REQUEST_FILE_LARGE_SIZE, 'Wrong error message');
        assert.equal(parameters.maxSize, maxSize, 'Wrong error parameters');
    });

    it('POST /api/files/upload should an error for large size JPEG file with thumbnail', async () => {
        const form = createForm(largeWeightJpegFile);
        const {statusCode, payload} = await post('/api/files/upload', form, null, form.getHeaders());
        const {message, parameters} = JSON.parse(payload);
        assert.equal(statusCode, HttpStatus.BAD_REQUEST, 'Wrong error code');
        assert.equal(message, ErrorMessages.BAD_REQUEST_FILE_LARGE_SIZE, 'Wrong error message');
        assert.equal(parameters.maxSize, maxSize, 'Wrong error parameters');
    });
});
