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
    @ApiProperty({description: 'First Name'})
    @IsNotEmpty()
    readonly firstName: string;

    @ApiProperty({description: 'Last Name'})
    @IsNotEmpty()
    readonly lastName: string;

    @ApiProperty({description: 'Country'})
    @IsNotEmpty()
    readonly country: string;
}

export class UserUpdateDto {
    @ApiProperty({description: 'Password'})
    @IsOptional()
    readonly password?: string;

    @ApiProperty({description: 'Repeated Password'})
    @IsOptional()
    readonly repeatedPassword?: string;

    @ApiProperty({description: 'First Name'})
    @IsOptional()
    readonly firstName: string;

    @ApiProperty({description: 'Last Name'})
    @IsOptional()
    readonly lastName: string;

    @ApiProperty({description: 'Country'})
    @IsOptional()
    readonly country: string;

    @ApiProperty({description: 'About'})
    @IsOptional()
    readonly about: string;
}
