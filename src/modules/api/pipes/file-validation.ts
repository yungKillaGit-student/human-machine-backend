import {Injectable, PipeTransform} from '@nestjs/common';
import {lookup as getMimeFromName} from 'mime-types';

import config from '../../../configuration';
import {ErrorUtils, ExceptionBuilder} from '../../../utils';
import {FileContent, FileUploadDto} from '../interfaces';

interface IFileUploadValidationPipeOptions {
    maxSize?: number;
    maxNameLength?: number;
}

const defaults: IFileUploadValidationPipeOptions = {
    maxSize: config.uploadSettings.maxSize,
    maxNameLength: config.uploadSettings.maxNameLength,
};

const {uploadSettings} = config;
const imageExtensions: string[] = uploadSettings.imageExtensions instanceof Array
    ? uploadSettings.imageExtensions
    : Object.values(uploadSettings.imageExtensions);

@Injectable()
export class FileUploadValidationPipe implements PipeTransform {
    readonly maxSize: number;

    readonly maxNameLength: number;

    constructor({
        maxSize = defaults.maxSize,
        maxNameLength = defaults.maxNameLength,
    }: IFileUploadValidationPipeOptions = {}) {
        this.maxSize = maxSize;
        this.maxNameLength = maxNameLength;
    }

    async transform(value: FileUploadDto) {
        if (!value) {
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST_FILE_WRONG_DATA, {message: 'File is Empty'});
        }

        const {name = '', file} = value;
        const {data} = file as FileContent;
        const size = data.length;
        if (name.length > this.maxNameLength) {
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST_FILE_LARGE_NAME, {maxNameLength: this.maxNameLength});
        }
        if (!name || !getMimeFromName(name)) {
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST_FILE_WRONG_DATA, {message: 'Unknown type'});
        }
        if (size > this.maxSize) {
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST_FILE_LARGE_SIZE, {maxSize: this.maxSize});
        }

        const isImage = imageExtensions.some(ext => name.toLowerCase().endsWith(`.${ext}`));
        if (!isImage) {
            ErrorUtils.throwHttpException(ExceptionBuilder.BAD_REQUEST_FILE_WRONG_DATA, {message: 'File must be image'});
        }

        return value;
    }
}
