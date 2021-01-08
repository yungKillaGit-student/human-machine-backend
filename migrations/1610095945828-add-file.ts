import {MigrationInterface, QueryRunner, Table} from 'typeorm';

export class addFile1610095945828 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        await queryRunner.createTable(
            new Table({
                name: 'file',
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
                    }, {
                        name: 'data',
                        type: 'bytea',
                    },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
