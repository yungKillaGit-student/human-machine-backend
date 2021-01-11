import {MigrationInterface, QueryRunner, Table} from "typeorm";

export class addEvent1610292196215 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableName = "event";
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
                        name: 'startDate',
                        type: 'date',
                    }, {
                        name: 'cOneDate',
                        type: 'date',
                    }, {
                        name: 'cPlusOneDate',
                        type: 'date',
                    }, {
                        name: 'finishDate',
                        type: 'date',
                    },
                ],
            }),
        );
        await queryRunner.query(`ALTER TABLE "${tableName}" ADD COLUMN "imageId" uuid REFERENCES "file" (id) DEFAULT NULL;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
