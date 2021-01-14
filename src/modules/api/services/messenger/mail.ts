import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';

import config from '../../../../configuration';
import {ErrorUtils, ExceptionBuilder, Logger} from '../../../../utils';
import {MailMessenger} from '../../../../utils/messenger/mail';

import {MailMessengerTypes} from './types';

export interface IMailMessengerOptions {
    email: string;
    password?: string;
    name?: string;
    userId: string;
    type: MailMessengerTypes;
    confirmToken: string;
}

@Injectable()
export class MailMessengerService {
    logger = Logger.getLogger('MailMessengerService');

    constructor(
        private configService: ConfigService,
    ) {
    }

    private async init(): Promise<MailMessenger | void> {
        this.logger.trace('init', 'init');

        const name = this.configService.get<string>('MESSENGER_USER_NAME');
        const email = this.configService.get<string>('MESSENGER_USER_EMAIL');
        try {
            const messenger = MailMessenger.getInstanceWithDefaultOptions();
            this.logger.info(`mailer is initialized: ${name} <${email}>`, 'initMessenger');
            return messenger;
        } catch (error) {
            this.logger.info('messenger is not available: not enough parameters', 'initMessenger');
            ErrorUtils.throwHttpException(ExceptionBuilder.MAILER_SERVICE_UNAVAILABLE);
        }
    }

    async send({
        email, password, name, type, confirmToken, userId,
    }: IMailMessengerOptions): Promise<any> {
        this.logger.trace('sendMessage', 'sendMessage');

        let mailResponse;
        const messenger = await this.init() as MailMessenger;
        switch (type) {
            case MailMessengerTypes.USER_CREATED:
                mailResponse = await messenger.sendUserCreated({
                    to: [email],
                    userEmail: email,
                    userPassword: password,
                    userName: name,
                    confirmLink: `${config.url}/users/${userId}/verify/${confirmToken}`,
                });
                break;
            default:
                break;
        }

        if (!mailResponse || !mailResponse.accepted.includes(email)) {
            this.logger.warn(`Mail is not sent to '${email}'`, 'send');
            ErrorUtils.throwHttpException(ExceptionBuilder.MAILER_SERVICE_UNAVAILABLE, {email});
        } else {
            this.logger.debug(`mail is sent to '${email}'`, 'send');
        }

        return mailResponse;
    }
}
