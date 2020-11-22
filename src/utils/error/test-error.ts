import {HttpException} from '@nestjs/common/exceptions/http.exception';

import {Logger} from '../logger';

import {ErrorMessages} from './error-messages';

class RtxError extends HttpException {
    parameters: any;
}

export class TestErrorUtils {
    public static throwExceptionWithCode(code: number, message: ErrorMessages, parameters = {}) {
        throw TestErrorUtils.getExceptionWithCode(message, parameters, code);
    }

    public static getExceptionWithCode(message: ErrorMessages, parameters = {}, code: number): RtxError {
        Logger.error(message, parameters, code);
        const error = new RtxError({message, parameters, code}, code);
        error.parameters = parameters;
        return error;
    }
}
