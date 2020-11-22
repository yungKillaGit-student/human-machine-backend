import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty} from 'class-validator';

export class VersionResponseDto {
    @ApiProperty({description: 'Version'})
    @IsNotEmpty()
    readonly version: string;
}
