import {HttpStatus} from '@nestjs/common';
import {assert} from 'chai';

import {version} from '../../../package.json';
import {TestHelper} from '../test-helper';

describe('CHECK MAIN', () => {
    const {get} = new TestHelper();

    it('GET / should response with API version', async () => {
        const {statusCode, payload} = await get('/');
        assert.equal(statusCode, HttpStatus.OK, 'Wrong code');
        const body = JSON.parse(payload);
        assert.exists(body.version, 'Version does not exist in response');
        assert.equal(body.version, version, 'Wrong response');
    });
});
