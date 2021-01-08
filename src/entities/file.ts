import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity('file', {orderBy: {name: 'ASC'}})
export class File {
    @PrimaryGeneratedColumn({type: 'uuid'})
    id: string;

    @Column({
        type: 'varchar',
        name: 'name',
        unique: true,
    })
    name: string;

    @Column({
        type: 'bytea',
        name: 'data',
    })
    data: Buffer;

    width?: number;

    height?: number;
}
