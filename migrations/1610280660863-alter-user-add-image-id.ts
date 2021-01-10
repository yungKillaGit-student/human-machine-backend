import {MigrationInterface, QueryRunner} from "typeorm";

export class alterUserAddImageId1610280660863 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "user" ADD COLUMN "imageId" uuid REFERENCES "file" (id) DEFAULT NULL;');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
