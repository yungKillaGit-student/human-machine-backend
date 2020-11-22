import {HttpStatus} from '@nestjs/common';
import {HttpException} from '@nestjs/common/exceptions/http.exception';
import {camelCase} from 'lodash';
import {UpdateResult} from 'typeorm';

import {Logger} from '../logger';

import {ErrorMessages} from './error-messages';
import {ExceptionBuilder, IException} from './exception-builder';

export class ApiError extends HttpException {
    parameters: any;
}

export class ErrorUtils {
    static throwException(message: string) {
        Logger.error(message);
        throw new Error(message);
    }

    static throwHttpException(exception: IException, parameters = {}) {
        throw ErrorUtils.getHttpException(exception, parameters);
    }

    static throwHttpNotFound(entityName: string, parameters = {}) {
        throw ErrorUtils.getHttpException({
            message: ErrorMessages.OBJECT_NOT_FOUND,
            status: HttpStatus.NOT_FOUND,
        }, {...parameters, entity: entityName});
    }

    static getHttpException(exception: IException, parameters = {}): ApiError {
        return ErrorUtils.getExceptionWithCode(exception.message, parameters, exception.status);
    }

    static getInternalServerException(originalException): ApiError {
        const {message, parameters} = originalException;
        const stack = originalException.name === 'QueryFailedError' ? {} : originalException.stack;
        Logger.error(message ? message : '', parameters, HttpStatus.INTERNAL_SERVER_ERROR, stack);
        return ErrorUtils.getHttpException(ExceptionBuilder.INTERNAL_SERVER_ERROR);
    }

    static getExceptionWithCode(message: ErrorMessages, parameters = {}, code: number): ApiError {
        Logger.error(message, parameters, code);
        const error = new ApiError({message, parameters, code}, code);
        error.parameters = parameters;
        return error;
    }

    static handleDBException(err, entity = '', data = {}) {
        let handledException: ApiError = null;
        if (err.code === '23505') { // object already exists
            for (const fieldName of ['siteId', 'partnerId', 'customerId']) {
                delete data[fieldName];
            }
            const errorFieldsString = err.detail.match(/\((.*?)\)/)[0].replace(/[ ()]/g, '');
            const errorFields = errorFieldsString.split(',').map(field => camelCase(field));
            const fields = Object.entries(data)
                .filter(([fieldName]) => errorFields.includes(fieldName))
                .map(([fieldName, value]) => ({fieldName, value}));
            handledException = this.getHttpException(ExceptionBuilder.CONFLICT_OBJECT_ALREADY_EXIST, {entity, fields});
        } else if (err.code === '23502') { // not null violation
            handledException = ErrorUtils.getHttpException(ExceptionBuilder.BAD_REQUEST, {parameters: [err.column.toLowerCase()]});
        } else if (err.name === 'EntityColumnNotFound') { // wrong column
            const column = err.message
                .substring(err.message.indexOf('"'), err.message.lastIndexOf('"'))
                .replace(/[\\"]/g, '')
                .toLowerCase();
            handledException = ErrorUtils.getHttpException(ExceptionBuilder.BAD_REQUEST, {parameters: [column]});
        } else if (err.status === HttpStatus.NOT_FOUND) {
            handledException = ErrorUtils.getHttpException(ExceptionBuilder.OBJECT_NOT_FOUND, {entity});
        } else if ([HttpStatus.CONFLICT, HttpStatus.BAD_REQUEST].includes(err.status)) {
            handledException = err;
        } else {
            handledException = ErrorUtils.getInternalServerException(err);
        }
        throw handledException;
    }

    static handleUpdateResult(updateResult: UpdateResult, entity: string, data: any) {
        if (updateResult.affected === 0) {
            ErrorUtils.throwHttpException(ExceptionBuilder.OBJECT_NOT_FOUND, {entity, ...data});
        }
    }
}
