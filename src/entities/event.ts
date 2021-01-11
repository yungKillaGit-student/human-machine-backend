import {ApiProperty} from '@nestjs/swagger';
import {
    Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';

import {File} from './file';

@Entity('event', {orderBy: {title: 'ASC'}})
export class Event {
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
        type: 'date',
        name: 'startDate',
        nullable: false,
    })
    startDate: Date;

    @Column({
        type: 'date',
        name: 'cOneDate',
        nullable: false,
    })
    cOneDate: Date;

    @Column({
        type: 'date',
        name: 'cPlusOneDate',
        nullable: false,
    })
    cPlusOneDate: Date;

    @Column({
        type: 'date',
        name: 'finishDate',
        nullable: false,
    })
    finishDate: Date;

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
