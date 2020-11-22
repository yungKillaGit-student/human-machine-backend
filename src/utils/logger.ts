import {join} from 'path';

import * as chalk from 'chalk';
import {ensureDir} from 'fs-extra';
import jsonColorize = require('json-colorizer');
import * as morgan from 'morgan';
import * as rotatefs from 'rotating-file-stream';
import * as winston from 'winston';

import config from '../configuration';

const {env, logLevel} = config;
const logsFolder = join(config.rootPath, './logs');

export const jsonColorOptions = { // for logger interceptor, see chalk.ForegroundColor
    STRING_LITERAL: 'green',
    NUMBER_LITERAL: 'yellowBright',
    BOOLEAN_LITERAL: 'yellowBright',
    NULL_LITERAL: 'whiteBright',
    STRING_KEY: 'white',
    BRACE: 'red',
    BRACKET: 'magenta',
    COLON: 'white',
    COMMA: 'white',
};

const logColors = { // see chalk.ForegroundColor
    prefix: 'whiteBright',
    error: 'red',
    warn: 'magenta',
    info: 'green',
    debug: 'blue',
    silly: 'cyan',
};

const logFileDefaults = {
    json: false,
    tailable: true,
    timestamp: true,
    maxsize: 33554432 /* bytes */, // = 32MB
    maxFiles: 5, // when MAX_FILE_SIZE is exceeded a postfix with the number will be added,
    format: winston.format.combine(
        winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
        winston.format.simple(),
        winston.format.printf(info => `${info.timestamp} ${process.pid} ${info.level}: ${info.message}`),
    ),
};

const outputFile = {
    ...logFileDefaults,
    name: 'all',
    filename: join(logsFolder, 'output.log'),
};

const errorFile = {
    ...logFileDefaults,
    name: 'errors',
    level: 'error',
    filename: join(logsFolder, 'errors.log'),
};

const exceptionFile = {
    ...logFileDefaults,
    handleExceptions: true,
    filename: join(logsFolder, 'exceptions.log'),
};

export enum LoggingPrefixes {
    PARAMETERS = 'Parameters: ',
    RESULT = 'Result: ',
    BODY = 'Body: ',
    QUERY = 'Query: ',
}

export class Logger {
    static async init(app) {
        await ensureDir(logsFolder);
        const accessLogStream = rotatefs.createStream('access.log', {
            path: logsFolder,
            size: '10M', // rotate every 10 MegaBytes written
            maxFiles: 5, // the maximum number of rotated files to keep
            interval: '1d', // rotate daily
        });

        morgan.token('http-version', req => req.httpVersion);
        app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', {stream: accessLogStream}));
        winston.configure({
            exitOnError: false,
            level: logLevel,
            transports: [
                new winston.transports.File(outputFile),
                new winston.transports.File(errorFile),
            ],
            exceptionHandlers: [
                new winston.transports.File(exceptionFile),
            ],
            silent: env === 'test' && !!process.env['LOG_TEST_DISABLED'],
        });

        // if (env !== 'prod') { // No prod environment
        winston.add(new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
                winston.format.printf(({level, message, timestamp}) => {
                    const re = /\[[^\]]*\]/;
                    const methodName = re.exec(message) || '';
                    let text = message.replace(re, '').trim();
                    let prefix = '';
                    for (const possiblePrefix of Object.values(LoggingPrefixes)) {
                        if (text.startsWith(possiblePrefix)) {
                            prefix = possiblePrefix;
                        }
                    }
                    if (prefix) {
                        const data = text.replace(prefix, '');
                        text = chalk`{${logColors.prefix} ${prefix}}${jsonColorize(data, {colors: jsonColorOptions})}`;
                    }
                    return chalk`{grey ${timestamp}} {${logColors[level]} ${level.padEnd(6, ' ')}} {yellow ${methodName}} ${text}`;
                }),
            ),
        }));
        // }
    }

    static error(message, parameters = {}, code?: number, stack = {}) {
        const isEmpty = obj => {
            for (const property in obj) {
                return false;
            }
            return true;
        };
        if (code) {
            winston.error(`${code}: ${message} ${!isEmpty(parameters) ? `${JSON.stringify(parameters)}` : ''}${!isEmpty(stack) ? `\r\n${JSON.stringify(stack)}` : ''}`);
        } else {
            winston.error(`${message} ${!isEmpty(parameters) ? `${JSON.stringify(parameters)}` : ''}${!isEmpty(stack) ? `\r\n${JSON.stringify(stack)}` : ''}`);
        }
    }

    static warn(message) {
        winston.warn(message);
    }

    static info(message) {
        winston.info(message);
    }

    static debug(message) {
        winston.debug(message);
    }

    static trace(message) {
        winston.silly(message);
    }

    static exception(err: any) {
        winston.error(err.stack);
    }

    static getLogger(cls: string) {
        const mess = (message, funcName) => funcName ? `[${cls}.${funcName}] ${message}` : `[${cls}] ${message}`;

        return {
            warn: (message, funcName = '') => {
                Logger.warn(mess(message, funcName));
            },
            info: (message, funcName = '') => {
                Logger.info(mess(message, funcName));
            },
            debug: (message, funcName = '') => {
                Logger.debug(mess(message, funcName));
            },
            error: (message, parameters = {}, code?: number, funcName?: string) => {
                Logger.error(mess(message, funcName), parameters, code);
            },
            trace: (message, funcName = '') => {
                Logger.trace(mess(message, funcName));
            },
        };
    }
}

/**
 * OR, if you want result as colored util.inspect formatted string: 
 * 
 * import {inspect} from 'util';
 * ...
 * if (prefix) {
 *     const data = JSON.parse(text.replace(prefix, ''));
 *     text = `${prefix}${inspect(data, {colors: true, compact: 2, depth: 2, maxArrayLength: 5})}`;
 * }
 */
