import {ApiProperty} from '@nestjs/swagger';
import {
    Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';

import {Event} from './event';
import {Role} from './role';

@Entity('document', {orderBy: {title: 'ASC'}})
export class Document {
    @PrimaryGeneratedColumn({type: 'uuid'})
    id: string;

    @Column({
        type: 'varchar',
        name: 'title',
        unique: true,
        nullable: false,
    })
    title: string;

    @Column({
        type: 'varchar',
        name: 'day',
        nullable: false,
    })
    day: string;

    @Column({
        type: 'varchar',
        name: 'content',
        nullable: false,
    })
    content: string;

    @Column({
        type: 'bool',
        name: 'isSigned',
        nullable: false,
        default: false,
    })
    isSigned: boolean;

    @Column({
        type: 'varchar',
        name: 'roleId',
        nullable: false,
    })
    roleId: string;

    @ApiProperty({type: () => Role})
    @ManyToOne(() => Role)
    @JoinColumn({name: 'roleId'})
    role: Role;

    @Column({
        type: 'varchar',
        name: 'eventId',
        nullable: true,
    })
    eventId?: string;

    @ApiProperty({type: () => Event})
    @ManyToOne(() => Event)
    @JoinColumn({name: 'eventId'})
    event?: Event;
}
