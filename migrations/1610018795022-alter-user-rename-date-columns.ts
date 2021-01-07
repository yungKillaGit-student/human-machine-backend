import {MigrationInterface, QueryRunner} from 'typeorm';

export class alterUserRenameDateColumns1610018795022 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "user" RENAME COLUMN created_at TO "createdAt"');
        await queryRunner.query('ALTER TABLE "user" RENAME COLUMN updated_at TO "updatedAt"');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
