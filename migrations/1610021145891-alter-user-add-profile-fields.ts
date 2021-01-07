import {MigrationInterface, QueryRunner} from 'typeorm';

export class alterUserAddProfileFields1610021145891 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableName = 'user';
        await queryRunner.query(`ALTER TABLE "${tableName}" ADD COLUMN "firstName" VARCHAR NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${tableName}" ADD COLUMN "lastName" VARCHAR NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${tableName}" ADD COLUMN "country" VARCHAR NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${tableName}" ADD COLUMN "about" VARCHAR`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
