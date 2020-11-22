import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';

import {Logger} from '../utils';

function handleHttpError(err: HttpException, response: any) {
    const data = err.getResponse();
    const httpStatusCode = err.getStatus();

    if (!httpStatusCode) {
        throw new Error('Http status code is undefined');
    }

    if (typeof response.code === 'function') {
        response.code(httpStatusCode).send(data);
    } else {
        response.writeHead(httpStatusCode);
        response.end(JSON.stringify(data));
    }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(err: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        if (err instanceof HttpException) {
            handleHttpError(err, response);
        } else {
            Logger.exception(err);

            if (typeof response.code === 'function') {
                response.code(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    message: 'Internal Server Error',
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                });
            } else {
                response.writeHead(HttpStatus.INTERNAL_SERVER_ERROR);
                response.end(JSON.stringify({
                    message: 'Internal Server Error',
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                }));
            }
        }
    }
}
