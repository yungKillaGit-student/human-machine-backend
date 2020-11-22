import {ApiProperty} from '@nestjs/swagger';
import {
    BeforeInsert,
    BeforeUpdate,
    Column,
} from 'typeorm';

export class Temporal {
    @Column({
        type: 'timestamp with time zone',
        name: 'updated_at',
        default: () => 'now()',
    })
    @ApiProperty({description: 'Updated At'})
    updatedAt?: Date;

    @Column({
        type: 'timestamp with time zone',
        name: 'created_at',
        default: () => 'now()',
    })
    @ApiProperty({description: 'Created At'})
    createdAt?: Date;

    @BeforeInsert()
    setCreatedAt?(): void {
        this.createdAt = new Date();
    }

    @BeforeInsert()
    @BeforeUpdate()
    setUpdatedAt?(): void {
        this.updatedAt = new Date();
    }
}
