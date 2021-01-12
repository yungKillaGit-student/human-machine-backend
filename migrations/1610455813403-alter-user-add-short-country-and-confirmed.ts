import {MigrationInterface, QueryRunner} from 'typeorm';

export class alterUserAddShortCountryAndConfirmed1610455813403 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableName = 'user';
        await queryRunner.query(`ALTER TABLE "${tableName}" ADD COLUMN "shortCountry" VARCHAR NOT NULL`);
        await queryRunner.query(`ALTER TABLE "${tableName}" ADD COLUMN "isConfirmed" bool NOT NULL DEFAULT FALSE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
