import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';

export interface ISwaggerOptions {
    title?: string;
    description?: string;
    version?: string;
    destination?: string;
}

const defaults: ISwaggerOptions = {
    title: 'Template API',
    description: 'Template API description',
    version: '0.0.1',
    destination: '/swagger',
};

export class Swagger {
    static init(app, options: ISwaggerOptions = {}) {
        const resultOptions = new DocumentBuilder()
            .setTitle(options.title || defaults.title)
            .setDescription(options.description || defaults.description)
            .setVersion(options.version || process.env.npm_package_version || defaults.version)
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, resultOptions);
        SwaggerModule.setup(options.destination || defaults.destination, app, document);
    }
}
