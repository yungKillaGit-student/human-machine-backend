import {
    Body, Controller, Get, HttpStatus, Param, Post, Res, UsePipes,
} from '@nestjs/common';
import {ApiConsumes, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {lookup as getMimeFromName} from 'mime-types';

import {ErrorMessages} from '../../../utils';
import {FileContent, FileUploadDto, FileUploadResponseDto} from '../interfaces';
import {FileUploadValidationPipe} from '../pipes';
import {FileService} from '../services';

@ApiTags('files')
@Controller('api/files')
export class FileController {

    constructor(private readonly fileService: FileService) {
    }

    @ApiOperation({summary: 'Get a file'})
    @ApiResponse({status: HttpStatus.OK, description: 'Get a file', content: {'*': {}}})
    @ApiResponse({status: HttpStatus.NOT_FOUND, description: ErrorMessages.OBJECT_NOT_FOUND})
    @Get(':name')
    async get(@Param('name') name: string, @Res() res): Promise<any> {

        const stream = await this.fileService.load(name);
        return res.type(getMimeFromName(name) || '').send(stream);
    }

    @ApiOperation({summary: 'Upload a file'})
    @ApiResponse({status: HttpStatus.CREATED, description: 'File uploaded', type: FileUploadResponseDto})
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: [
            ErrorMessages.BAD_REQUEST_FILE_LARGE_NAME,
            ErrorMessages.BAD_REQUEST_FILE_LARGE_SIZE,
            ErrorMessages.BAD_REQUEST_FILE_LARGE_RESOLUTION,
            ErrorMessages.BAD_REQUEST_FILE_WRONG_DATA,
            ErrorMessages.FILE_COULD_NOT_BE_UPLOADED,
        ].join(',\n'),
    })
    @ApiConsumes('multipart/form-data')
    @UsePipes(new FileUploadValidationPipe())
    @Post('upload')
    async upload(@Body() fileUploadDto: FileUploadDto): Promise<FileUploadResponseDto> {
        const {name = '', file} = fileUploadDto;
        const {data} = file as FileContent;
        const result = await this.fileService.save({name, data});
        return {
            name: result.name,
            height: result.height || 0,
            width: result.width || 0,
        } as FileUploadResponseDto;
    }
}
