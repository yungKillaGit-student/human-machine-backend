import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsOptional} from 'class-validator';

export class EventCreateDto {
    @ApiProperty({description: 'Event Title'})
    @IsNotEmpty()
    readonly title: string;

    @ApiProperty({description: 'Start Date'})
    @IsNotEmpty()
    readonly startDate: Date;

    @ApiProperty({description: 'C1 Date'})
    @IsNotEmpty()
    readonly cOneDate: Date;

    @ApiProperty({description: 'C+1 Date'})
    @IsNotEmpty()
    readonly cPlusOneDate: Date;

    @ApiProperty({description: 'Finish Date'})
    @IsNotEmpty()
    readonly finishDate: Date;
}

export class EventUpdateDto {
    @ApiProperty({description: 'Event Title'})
    @IsOptional()
    readonly title?: string;

    @ApiProperty({description: 'Start Date'})
    @IsOptional()
    readonly startDate?: Date;

    @ApiProperty({description: 'C1 Date'})
    @IsOptional()
    readonly cOneDate?: Date;

    @ApiProperty({description: 'C+1 Date'})
    @IsOptional()
    readonly cPlusOneDate?: Date;

    @ApiProperty({description: 'Finish Date'})
    @IsOptional()
    readonly finishDate?: Date;

    @ApiProperty({description: 'Image name'})
    @IsOptional()
    readonly imageName: string;
}
