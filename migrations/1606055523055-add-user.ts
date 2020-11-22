import {MigrationInterface, QueryRunner, Table} from 'typeorm';

export class addUser1606055523055 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        await queryRunner.createTable(
            new Table({
                name: 'user',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isGenerated: true,
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    }, {
                        name: 'email',
                        type: 'varchar',
                        isUnique: true,
                    }, {
                        name: 'password',
                        type: 'varchar',
                    }, {
                        name: 'created_at',
                        type: 'timestamp with time zone',
                    }, {
                        name: 'updated_at',
                        type: 'timestamp with time zone',
                        isNullable: true,
                    },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
