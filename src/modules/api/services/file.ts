import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {imageSize as getImageMetadata} from 'image-size';
import {read as readImage} from 'jimp';
import {Repository} from 'typeorm';

import config from '../../../configuration';
import {File} from '../../../entities';
import {ErrorUtils, ExceptionBuilder, Logger} from '../../../utils';
import {FileContent, FileUploadResponseDto} from '../interfaces';

@Injectable()
export class FileService {
    logger = Logger.getLogger('FileService');

    constructor(
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
    ) {
    }

    async get(name: string): Promise<File> {
        this.logger.trace(name, 'get');

        const file = await this.fileRepository.findOne({name});
        if (!file) {
            ErrorUtils.throwHttpException(ExceptionBuilder.OBJECT_NOT_FOUND, {entity: File.name, id: name});
        }

        return file;
    }

    async load(name: string): Promise<Buffer> {
        this.logger.trace(name, 'load');

        const file = await this.get(name);
        return file.data;
    }

    async save(content: FileContent): Promise<FileUploadResponseDto> {
        this.logger.trace(content.name, 'save');

        const {name, data} = content;
        let imageMeta: {height?: number; orientation?: number; width?: number; type?: string} = {};
        try {
            imageMeta = getImageMetadata(data);
        } catch (err) {
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST_FILE_WRONG_DATA, {message: 'Image doesn\'t support getting resolution'});
        }

        const entry = new File();
        entry.data = data;
        entry.name = name;
        const file = await this.fileRepository.save(entry);

        return {...file, height: imageMeta.height, width: imageMeta.width};
    }

    async delete(name: string): Promise<void> {
        this.logger.trace(name, 'delete');

        await this.fileRepository.delete({name});
    }
}
