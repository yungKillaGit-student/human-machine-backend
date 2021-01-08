import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty} from 'class-validator';

export class FileContent {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    data: Buffer;
}

export class FileUploadResponseDto {
    @ApiProperty({description: 'Name'})
    @IsNotEmpty()
    name: string;

    @ApiProperty({description: 'Width (for supported image types)'})
    width?: number;

    @ApiProperty({description: 'Height (for supported image types)'})
    height?: number;
}

export class FileUploadDto {
    @ApiProperty({description: 'Name'})
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Content',
        type: 'File',
    })
    @IsNotEmpty()
    file: any;
}
