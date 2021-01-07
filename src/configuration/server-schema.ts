import {environments, logLevels} from './server';

export interface IConfig {
    env: typeof environments[number];
    envPath: string;
    serverName: string;
    host: string;
    httpPort: number;
    pathPrefix: string;
    url: string;
    logLevel: typeof logLevels[number];
    shouldSkipTests: boolean;
    assetsDirectory: string;
    storageDirectory: string;
    tmpDirectory: string;
    rootPath: string;
    cacheResponse: boolean | number;
    hostName: string;
    dataSource: {
        dbType: string;
        connectionSettings: any;
    };
    cleanDBsOnStart: boolean;
    jwtSecret: string;
    jwtLifeTime: number;
    enableDocs: boolean;
    userSettings: {
        defaultLogin: string;
        defaultPassword: string;
        defaultFirstName: string;
        defaultLastName: string;
        defaultCountry: string;
        cookie: { lifetime: number };
        redirect: { lifetime: number };
    };
    uploadSettings: {
        maxSize: number;
        maxResolution: number;
        maxNameLength: number;
        imageExtensions: string[];
        thumbnail: {
            maxHeight: number;
            maxWidth: number;
            prefix: string;
        };
    };
    session: {
        lifetime: number;
    };
}

export const schema = {
    properties: {
        env: {type: 'string', enum: [...environments]},
        envPath: {type: 'string'},
        serverName: {type: 'string', format: 'url', required: false},
        host: {type: 'string', format: 'url', required: true},
        httpPort: {type: 'integer', required: true},
        pathPrefix: {type: 'string'},
        url: {type: 'string'},
        logLevel: {
            type: 'string',
            enum: [...logLevels],
            required: true,
        },
        shouldSkipTests: {type: 'boolean', required: false},
        rootPath: {type: 'string'},
        assetsDirectory: {type: 'string', allowEmpty: false, required: true},
        storageDirectory: {type: 'string', allowEmpty: false, required: true},
        tmpDirectory: {type: 'string', allowEmpty: false, required: true},
        cacheResponse: {type: ['boolean', 'integer']},
        dataSource: {
            properties: {
                dbType: {type: 'string'},
                connectionSettings: {
                    properties: {
                        port: {type: 'number', allowEmpty: false, required: true},
                        host: {type: 'string', allowEmpty: false, required: true},
                        username: {type: 'string', allowEmpty: true, required: true},
                        password: {type: 'string', allowEmpty: true, required: true},
                        database: {type: 'string', allowEmpty: true, required: true},
                    },
                    additionalProperties: true,
                },
            },
        },
        hostName: {type: 'string', allowEmpty: true, required: false},
        hostPort: {type: 'integer', allowEmpty: true, required: false},
        cleanDBsOnStart: {type: 'boolean', allowEmpty: true, required: false},
        jwtSecret: {type: 'string', allowEmpty: true, required: true},
        jwtLifeTime: {type: 'integer', allowEmpty: false, required: true},
        enableDocs: {type: 'boolean', allowEmpty: true, required: false},
        userSettings: {
            properties: {
                defaultLogin: {type: 'string', allowEmpty: false, required: false},
                defaultPassword: {type: 'string', allowEmpty: false, required: false},
                defaultFirstName: {type: 'string', allowEmpty: false},
                defaultLastName: {type: 'string', allowEmpty: false},
                defaultCountry: {type: 'string', allowEmpty: false},
                cookie: {properties: {lifetime: {type: 'number', allowEmpty: false, required: true}}},
                redirect: {properties: {lifetime: {type: 'number', allowEmpty: false, required: true}}},
            },
        },
        uploadSettings: {
            properties: {
                maxSize: {type: 'number', allowEmpty: false, required: true},
                maxResolution: {type: 'number', allowEmpty: false, required: true},
                maxNameLength: {type: 'number', allowEmpty: false, required: true},
                imageExtensions: {type: 'any', allowEmpty: false, required: true},
                thumbnail: {
                    properties: {
                        maxHeight: {type: 'number', allowEmpty: false, required: true},
                        maxWidth: {type: 'number', allowEmpty: false, required: true},
                        prefix: {type: 'string', allowEmpty: false, required: true},
                    },
                },
            },
        },
        session: {properties: {lifetime: {type: 'number', allowEmpty: false, required: true}}},
    },
} as Revalidator.JSONSchema<any>;
