import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsOptional} from 'class-validator';

export class UserSigninDto {
    @ApiProperty({description: 'Email'})
    @IsNotEmpty()
    readonly email: string;

    @ApiProperty({description: 'Password'})
    @IsNotEmpty()
    readonly password: string;
}

export class UserCreateDto extends UserSigninDto {
    @ApiProperty({description: 'Name'})
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({description: 'Password'})
    @IsNotEmpty()
    readonly password: string;
}

export class UserUpdateDto {
    @ApiProperty({description: 'Email'})
    @IsOptional()
    readonly email: string;

    @ApiProperty({description: 'Password'})
    @IsOptional()
    readonly password?: string;
}
