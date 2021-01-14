import {readFileSync} from 'fs';
import {join} from 'path';

import {ConfigService} from '@nestjs/config';
import {render} from 'ejs';
import {createTransport} from 'nodemailer';
import Transport = require('nodemailer/lib/mailer');
import validator from 'validator';

import {ErrorUtils, ExceptionBuilder} from '..';
import config from '../../configuration';
import {User} from '../../entities';

const {assetsDirectory, rootPath} = config;

interface ITransportOptions {
    host: string;
    port: number;
    email: string;
    password: string;
    name: string;
}

interface IMailOptions {
    to: string[];
    cc?: string[];
    title?: string;
    text?: string;
    html?: string;
    attachments?: Transport.Attachment[];
    headers?: Transport.Headers;
}

interface IMailNotifyOptions extends IMailOptions {
    header?: string;
    lines?: string[];
}

interface IMailUserCreatedOptions extends IMailNotifyOptions {
    userEmail: string;
    userPassword?: string;
    userName: string;
    confirmLink: string;
}

const defaultMailOptions: IMailOptions = {
    to: [],
    cc: [],
    title: 'Mailer notification',
    text: 'No content',
    html: '<h3>No content</h3>',
    attachments: [],
    headers: [],
};

interface IMailResponse { // cause nodemailer.SentMessageInfo is 'any'
    accepted?: string[];
    rejected?: string[];
    envelopeTime?: number;
    messageTime?: number;
    messageSize?: number;
    response?: string;
    envelope?: {
        from: string;
        to: string[];
    };
    messageId?: string;
}

export class MailMessenger {

    private transport: Transport;

    readonly email: string;

    readonly name: string;

    static getInstanceWithDefaultOptions(): MailMessenger {
        const config = new ConfigService();
        const host = config.get<string>('MESSENGER_HOST');
        const port = config.get<number>('MESSENGER_PORT');
        const email = config.get<string>('MESSENGER_USER_EMAIL');
        const password = config.get<string>('MESSENGER_USER_PASSWORD');
        const name = config.get<string>('MESSENGER_USER_NAME');
        if (!host || !port || !email || !password || !name) {
            ErrorUtils.throwHttpException(ExceptionBuilder.MAILER_SERVICE_UNAVAILABLE);
        }
        return new MailMessenger({
            host,
            port,
            email,
            password,
            name,
        });
    }

    constructor(options: ITransportOptions) {
        this.email = options.email;
        this.name = options.name;
        this.transport = createTransport({
            host: options.host,
            port: options.port,
            secure: false,
            auth: {
                user: options.email,
                pass: options.password,
            },
        });
    }

    async sendEmail(options: IMailOptions): Promise<IMailResponse> {
        const {
            to, cc, title, text, html, attachments, headers,
        } = {...defaultMailOptions, ...options};
        return this.transport.sendMail({
            from: `${this.name} <${this.email}>`,
            to: to.join(', '),
            cc: cc.join(', '),
            subject: title,
            text,
            html,
            attachments,
            headers,
        });
    }

    async send(options: IMailOptions): Promise<IMailResponse> {
        const {
            to, cc, title, text, html, attachments, headers,
        } = {...defaultMailOptions, ...options};
        if (!to.length || [...to, ...cc].some(email => !validator.isEmail(email))) {
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST, {entity: User.name, parameters: ['email']});
        }

        return this.transport.sendMail({
            from: this.email,
            to: to.join(', '),
            cc: cc.join(', '),
            subject: title,
            text,
            html,
            attachments,
            headers,
        });
    }

    async sendUserCreated(options: IMailUserCreatedOptions): Promise<IMailResponse> {
        const welcomeTemplatePath = join(`${rootPath}/${assetsDirectory}/templates/mail/welcome-template.ejs`);
        const title = `Account for the ${this.name} service`;
        const renderContext = {
            title,
            userName: options.userName,
            userPassword: options.userPassword,
            userEmail: options.userEmail,
            confirmLink: options.confirmLink,
            serviceName: this.name,
            serviceEmail: this.email,
        };
        const html = render(readFileSync(welcomeTemplatePath).toString(), renderContext, {filename: welcomeTemplatePath});
        const textLines = [
            `Account for the ${this.name} service.`,
            `Hi, ${options.userName}`,
            `Login: ${options.userEmail}`,
            `Password: ${options.userPassword}`,
            `Confirm link: ${options.confirmLink}`,
        ];

        return this.send({...options, title, html, text: textLines.join('\n')});
    }
}
