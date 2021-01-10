import {createHmac} from 'crypto';

import {ApiProperty} from '@nestjs/swagger';
import {Exclude} from 'class-transformer';
import {
    BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';

import {Temporal} from './temporal';
import {File} from "./file";

@Entity('user', {orderBy: {createdAt: 'DESC'}})
export class User extends Temporal {
    @PrimaryGeneratedColumn({type: 'uuid'})
    id: string;

    @Column({
        type: 'varchar',
        name: 'email',
        unique: true,
        nullable: false,
    })
    @ApiProperty({description: 'Email'})
    email: string;

    @Column({
        type: 'varchar',
        name: 'password',
        nullable: false,
    })
    @Exclude()
    password?: string;

    @ApiProperty({description: 'Token', required: false})
    token?: string;

    @BeforeInsert()
    @BeforeUpdate()
    setPassword?(): void {
        if (this.password !== undefined && this.password.length < 60) {
            this.password = User.hashPassword(this.password);
        }
    }

    static hashPassword(p = ''): string {
        return createHmac('sha256', p).digest('hex');
    }

    static validatePassword(p = '', minLength = 8, hasUppersAndLowers = true, hasNumbers = true) {
        const result = {
            verified: false,
            minimalLength: {
                required: minLength,
                satisfied: false,
            },
            hasUppersAndLowers: {
                required: hasUppersAndLowers,
                satisfied: false,
            },
            hasNumbers: {
                required: hasNumbers,
                satisfied: false,
            },
        };
        if (p.length >= minLength) {
            result.minimalLength.satisfied = true;
        }
        if ([...p].some(c => !/[0-9]/.test(c) && c === c.toUpperCase()) && [...p].some(c => !/[0-9]/.test(c) && c === c.toLowerCase())) {
            result.hasUppersAndLowers.satisfied = true;
        }
        if (/[0-9]/.test(p)) {
            result.hasNumbers.satisfied = true;
        }
        if (result.minimalLength.satisfied) {
            if (hasUppersAndLowers && hasNumbers) {
                result.verified = result.hasUppersAndLowers.satisfied && result.hasNumbers.satisfied;
            } else if (hasUppersAndLowers) {
                result.verified = result.hasUppersAndLowers.satisfied;
            } else if (hasNumbers) {
                result.verified = result.hasNumbers.satisfied;
            }
        }
        return result;
    }

    @Column({
        type: 'varchar',
        name: 'firstName',
        nullable: false,
    })
    @ApiProperty({description: 'First Name'})
    firstName: string;

    @Column({
        type: 'varchar',
        name: 'lastName',
        nullable: false,
    })
    @ApiProperty({description: 'Last Name'})
    lastName: string;

    @Column({
        type: 'varchar',
        name: 'country',
        nullable: false,
    })
    @ApiProperty({description: 'Country'})
    country: string;

    @Column({
        type: 'varchar',
        name: 'about',
    })
    @ApiProperty({description: 'About', required: false})
    about?: string;

    @Column({
        type: 'varchar',
        name: 'pinCode',
    })
    @ApiProperty({description: 'PIN'})
    pinCode?: string;

    @Column({
        type: 'varchar',
        name: 'imageId',
    })
    imageId?: string;

    @ApiProperty({type: () => File})
    @ManyToOne(() => File)
    @JoinColumn({name: 'imageId'})
    image: File;
}
