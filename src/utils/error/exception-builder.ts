import {HttpStatus} from '@nestjs/common';

import {ErrorMessages} from './error-messages';

export interface IException {
    message: ErrorMessages;
    status: HttpStatus;
    getParameters?: any;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ExceptionBuilder = {
    // 400 BAD REQUEST
    BAD_REQUEST: {
        message: ErrorMessages.BAD_REQUEST,
        status: HttpStatus.BAD_REQUEST,
        getParameters: data => ({
            entity: data.entity,
            parameters: data.parameters,
        }),
    },
    // BAD REQUEST FILE UPLOAD
    BAD_REQUEST_FILE_LARGE_NAME: {
        message: ErrorMessages.BAD_REQUEST_FILE_LARGE_NAME,
        status: HttpStatus.BAD_REQUEST,
        getParameters: data => ({
            resolution: data.maxResolution,
            maxResolution: data.maxResolution,
        }),
    },
    BAD_REQUEST_FILE_LARGE_RESOLUTION: {
        message: ErrorMessages.BAD_REQUEST_FILE_LARGE_RESOLUTION,
        status: HttpStatus.BAD_REQUEST,
        getParameters: data => ({maxNameLength: data.maxNameLength}),
    },
    BAD_REQUEST_FILE_LARGE_SIZE: {
        message: ErrorMessages.BAD_REQUEST_FILE_LARGE_SIZE,
        status: HttpStatus.BAD_REQUEST,
        getParameters: data => ({maxSize: data.maxSize}),
    },
    BAD_REQUEST_FILE_WRONG_DATA: {
        message: ErrorMessages.BAD_REQUEST_FILE_WRONG_DATA,
        status: HttpStatus.BAD_REQUEST,
        getParameters: data => ({message: data.message}),
    },
    // 401 UNAUTHORIZED
    UNAUTHORIZED: {
        message: ErrorMessages.USER_UNAUTHORIZED,
        status: HttpStatus.UNAUTHORIZED,
    },
    // 403 FORBIDDEN
    FORBIDDEN: {
        message: ErrorMessages.FORBIDDEN_DATA,
        status: HttpStatus.FORBIDDEN,
    },
    FORBIDDEN_ACTION: {
        message: ErrorMessages.FORBIDDEN_ACTION,
        status: HttpStatus.FORBIDDEN,
    },
    // 404 NOT FOUND
    OBJECT_NOT_FOUND: {
        message: ErrorMessages.OBJECT_NOT_FOUND,
        status: HttpStatus.NOT_FOUND,
        getParameters: data => ({
            entity: data.entityName,
            id: data.id,
        }),
    },
    // 406 NOT_ACCEPTABLE
    NOT_ACCEPTABLE: {
        message: ErrorMessages.NOT_ACCEPTABLE,
        status: HttpStatus.NOT_ACCEPTABLE,
    },
    // 409 CONFLICT
    CONFLICT_OBJECT_ALREADY_EXIST: {
        message: ErrorMessages.CONFLICT_OBJECT_ALREADY_EXISTS,
        status: HttpStatus.CONFLICT,
        getParameters: data => ({
            entity: data.entity,
            fields: data.fields,
        }),
    },
    // 410
    RESOURCE_IS_NOT_LONGER_AVAILABLE: {
        message: ErrorMessages.RESOURCE_IS_NOT_LONGER_AVAILABLE,
        status: HttpStatus.GONE,
    },
    // 500 INTERNAL SERVER ERROR
    INTERNAL_SERVER_ERROR: {
        message: ErrorMessages.INTERNAL_SERVER_ERROR,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
    },
    FILE_COULD_NOT_BE_UPLOADED: {
        message: ErrorMessages.FILE_COULD_NOT_BE_UPLOADED,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
    },
    // 502 BAD GATEWAY
    FAILED_ATTEMPT_TO_SEND_EMAIL: {
        message: ErrorMessages.FAILED_ATTEMPT_TO_SEND_EMAIL,
        status: HttpStatus.BAD_GATEWAY,
        getParameters: data => ({
            userName: data.userName,
            userEmail: data.userEmail,
        }),
    },
    // 503 SERVICE_UNAVAILABLE
    MAILER_SERVICE_UNAVAILABLE: {
        message: ErrorMessages.SERVICE_UNAVAILABLE_MAILER,
        status: HttpStatus.SERVICE_UNAVAILABLE,
        getParameters: data => ({email: data.email}),
    },
};
