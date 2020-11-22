import {Injectable, NestMiddleware} from '@nestjs/common';
import {parse} from 'cookie';
import {verify} from 'jsonwebtoken';

import config from '../../../configuration';
import {ErrorUtils, ExceptionBuilder, Logger} from '../../../utils';
import {UserService} from '../services';

const logger = Logger.getLogger('Auth');

@Injectable()
export class Auth implements NestMiddleware {

    constructor(private readonly userService: UserService) {
    }

    async use(req, res, next) {
        logger.trace('Get user data by token', 'use');

        const cookies = parse(req.headers.cookie || '');
        const {token = ''} = cookies;
        let decoded;

        logger.debug(token);

        if (token) {
            try {
                decoded = verify(token, config.jwtSecret);
            } catch (err) {
                ErrorUtils.throwHttpException(ExceptionBuilder.UNAUTHORIZED);
            }

            const {email} = decoded;
            const user = await this.userService.findOne({email});
            logger.debug(email, 'use');
            logger.debug(JSON.stringify(user), 'use');
            if (!user) {
                ErrorUtils.throwHttpException(ExceptionBuilder.UNAUTHORIZED);
            }
            if (!req.params) {
                req.params = {};
            }

            req.params.user = user;

            next();
        } else {
            ErrorUtils.throwHttpException(ExceptionBuilder.UNAUTHORIZED);
        }
    }
}
