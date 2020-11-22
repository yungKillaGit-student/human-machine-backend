import {Injectable} from '@nestjs/common';

import config from '../../../configuration';
import {ErrorUtils, ExceptionBuilder, Logger} from '../../../utils';

import {UserService} from './user';

const {lifetime: sessionLifetime = 1800} = config.session;

@Injectable()
export class SessionService {
  logger = Logger.getLogger('SessionService');

  private readonly isEnabled: boolean;

  constructor(
    private readonly userService: UserService,
  ) {
  }

  async refreshToken(req: any, user = null): Promise<string[]> {
      this.logger.trace('Refresh session token', 'refreshToken');

      const res = [];

      let tokenExpiredDate: Date;
      let newToken: string;

      try {
          const {
              _startTime: requestTime = new Date(),
              _remoteAddress: remoteAddress = 'unknown',
          } = {...req, ...req.raw};

          if (user) {
              tokenExpiredDate = new Date(requestTime);
              tokenExpiredDate = new Date(tokenExpiredDate.setSeconds(tokenExpiredDate.getSeconds() + sessionLifetime));
              newToken = this.userService.generateJwt(user, tokenExpiredDate);
          }
      } catch (err) {
          ErrorUtils.throwHttpException(ExceptionBuilder.NOT_ACCEPTABLE);
      }

      if (newToken) {
          res.push(`token=${newToken}; Max-Age=${sessionLifetime}; Path=/; HttpOnly; SameSite=Lax`);
      }

      if (tokenExpiredDate) {
          const tokenExpiredDateStr = tokenExpiredDate.toISOString();
          res.push(`tokenExpiredDate=${tokenExpiredDateStr}; Max-Age=${sessionLifetime}; Path=/; SameSite=Lax;`);
      }

      return res;
  }
}
