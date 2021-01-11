import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsOptional} from 'class-validator';

export class DocumentCreateDto {
    @ApiProperty({description: 'Document Title'})
    @IsNotEmpty()
    readonly title: string;

    @ApiProperty({description: 'Document Day'})
    @IsNotEmpty()
    readonly day: string;

    @ApiProperty({description: 'Document Content'})
    @IsNotEmpty()
    readonly content: string;

    @ApiProperty({description: 'For'})
    @IsNotEmpty()
    readonly roleName: string;
}

export class DocumentUpdateDto {
    @ApiProperty({description: 'Document Title'})
    @IsOptional()
    readonly title?: string;

    @ApiProperty({description: 'Document Day'})
    @IsOptional()
    readonly day?: string;

    @ApiProperty({description: 'Document Content'})
    @IsOptional()
    readonly content?: string;

    @ApiProperty({description: 'For'})
    @IsOptional()
    readonly roleName?: string;

    @ApiProperty({description: 'Signed'})
    @IsOptional()
    readonly isSigned?: boolean;
}
