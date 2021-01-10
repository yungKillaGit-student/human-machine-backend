import {MigrationInterface, QueryRunner, Table} from 'typeorm';

export class addRole1610286163868 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        await queryRunner.createTable(
            new Table({
                name: 'role',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isGenerated: true,
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    }, {
                        name: 'name',
                        type: 'varchar',
                        isUnique: true,
                    },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
