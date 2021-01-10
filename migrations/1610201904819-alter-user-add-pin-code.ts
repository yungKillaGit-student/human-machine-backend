import {MigrationInterface, QueryRunner} from 'typeorm';

export class alterUserAddPinCode1610201904819 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "user" ADD COLUMN "pinCode" VARCHAR NOT NULL');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
