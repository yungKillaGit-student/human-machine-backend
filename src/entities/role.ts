import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity('role', {orderBy: {name: 'ASC'}})
export class Role {
    @PrimaryGeneratedColumn({type: 'uuid'})
    id: string;

    @Column({
        type: 'varchar',
        name: 'name',
        unique: true,
    })
    name: string;
}
