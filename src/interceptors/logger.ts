import {CallHandler, ExecutionContext, Injectable, NestInterceptor} from '@nestjs/common';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';

import {Logger, LoggingPrefixes} from '../utils';

const excludeControllers = ['FileController'];

const {BODY, QUERY, RESULT} = LoggingPrefixes;

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        const controllerName = context.getClass().name;
        if (excludeControllers.includes(controllerName)) {
            return next.handle();
        }

        const logger = Logger.getLogger(controllerName);
        const req = context.switchToHttp().getRequest();

        if (req.query && Object.keys(req.query).length) {
            logger.debug(`${QUERY}${JSON.stringify(req.query)}`, context.getHandler().name);
        }
        if (req.body && Object.keys(req.body).length) {
            const body = {...req.body};
            if (body.password) {
                delete body.password;
            }
            logger.debug(`${BODY}${JSON.stringify(body)}`, context.getHandler().name);
        }

        return next
            .handle()
            .pipe(tap(result => logger.debug(`${RESULT}${result ? JSON.stringify(result) : null}`, context.getHandler().name)));
    }
}
