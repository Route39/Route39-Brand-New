import {MigrationInterface, QueryRunner} from "typeorm";

export class addRangePricingToTaxiOrder1743254200000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query(`ALTER TABLE request ADD COLUMN costMin FLOAT(10,2) NULL;`);
            await queryRunner.query(`ALTER TABLE request ADD COLUMN costMax FLOAT(10,2) NULL;`);
            await queryRunner.query(`ALTER TABLE request ADD COLUMN pricingMode ENUM('fixed', 'range') NOT NULL DEFAULT 'fixed';`);
            await queryRunner.query(`ALTER TABLE request ADD COLUMN rangePolicy ENUM('enforce', 'soft', 'open') NULL;`);
        } catch(error) {
            console.error('Migration error:', error);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query(`ALTER TABLE request DROP COLUMN rangePolicy;`);
            await queryRunner.query(`ALTER TABLE request DROP COLUMN pricingMode;`);
            await queryRunner.query(`ALTER TABLE request DROP COLUMN costMax;`);
            await queryRunner.query(`ALTER TABLE request DROP COLUMN costMin;`);
        } catch(error) {
            console.error('Rollback error:', error);
        }
    }

}
