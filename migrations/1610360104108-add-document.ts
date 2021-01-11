import {MigrationInterface, QueryRunner, Table} from 'typeorm';

export class addDocument1610360104108 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableName = 'document';
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        await queryRunner.createTable(
            new Table({
                name: tableName,
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isGenerated: true,
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    }, {
                        name: 'title',
                        type: 'varchar',
                        isUnique: true,
                    }, {
                        name: 'day',
                        type: 'varchar',
                    }, {
                        name: 'content',
                        type: 'varchar',
                    }, {
                        name: 'isSigned',
                        type: 'bool',
                        default: false,
                    },
                ],
            }),
        );
        await queryRunner.query(`ALTER TABLE "${tableName}" ADD COLUMN "roleId" uuid REFERENCES "role" (id) NOT NULL;`);
        await queryRunner.query(`ALTER TABLE "${tableName}" ADD COLUMN "eventId" uuid REFERENCES "event" (id) DEFAULT NULL;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
