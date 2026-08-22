import {MigrationInterface, QueryRunner} from "typeorm";

export class pricingModeRangePolicy1743254000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query(`ALTER TABLE service ADD COLUMN pricingMode ENUM('fixed', 'range') NOT NULL DEFAULT 'fixed';`);
            await queryRunner.query(`ALTER TABLE service ADD COLUMN rangePolicy ENUM('enforce', 'soft', 'open') NOT NULL DEFAULT 'enforce';`);
            await queryRunner.query(`ALTER TABLE service ADD COLUMN priceRangeMinPercent FLOAT(3,2) NOT NULL DEFAULT 0.80;`);
            await queryRunner.query(`ALTER TABLE service ADD COLUMN priceRangeMaxPercent FLOAT(3,2) NOT NULL DEFAULT 1.50;`);
        } catch(error) {
            console.error('Migration error:', error);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query(`ALTER TABLE service DROP COLUMN priceRangeMaxPercent;`);
            await queryRunner.query(`ALTER TABLE service DROP COLUMN priceRangeMinPercent;`);
            await queryRunner.query(`ALTER TABLE service DROP COLUMN rangePolicy;`);
            await queryRunner.query(`ALTER TABLE service DROP COLUMN pricingMode;`);
        } catch(error) {
            console.error('Rollback error:', error);
        }
    }

}
