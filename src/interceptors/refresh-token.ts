import {CallHandler, ExecutionContext, Injectable, NestInterceptor} from '@nestjs/common';
import {parse} from 'cookie';
import {Observable} from 'rxjs';
import {SessionService} from "../modules/api/services";

@Injectable()
export class RefreshTokenInterceptor implements NestInterceptor {
    constructor(private readonly sessionService: SessionService) {
    }

    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const sessionService = this.sessionService;
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();

        if (!res.headers['Set-Cookie'] && req.raw._startTime && req.raw.url !== '/api/users/signout') {
            const cookies: any = parse(req.headers['cookie'] || '');
            const {token = ''} = cookies;

            if (token) {
                const {user = null} = {...req.raw.params, ...req.params};
                const newCookies = await sessionService.refreshToken(req, user);
                res.header('Set-Cookie', newCookies);
            }
        }
        return next.handle();
    }
}
