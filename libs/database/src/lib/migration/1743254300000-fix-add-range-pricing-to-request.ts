import {MigrationInterface, QueryRunner} from "typeorm";

export class FixAddRangePricingToRequest1743254300000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fix for migration 1743254200000 which incorrectly used table name 'taxi_order' instead of 'request'
        // Add columns to the correct table 'request'
        try {
            await queryRunner.query(`ALTER TABLE request ADD COLUMN costMin FLOAT(10,2) NULL;`);
        } catch(error) {
            console.log('costMin column may already exist, skipping');
        }

        try {
            await queryRunner.query(`ALTER TABLE request ADD COLUMN costMax FLOAT(10,2) NULL;`);
        } catch(error) {
            console.log('costMax column may already exist, skipping');
        }

        try {
            await queryRunner.query(`ALTER TABLE request ADD COLUMN pricingMode ENUM('fixed', 'range') NOT NULL DEFAULT 'fixed';`);
        } catch(error) {
            console.log('pricingMode column may already exist, skipping');
        }

        try {
            await queryRunner.query(`ALTER TABLE request ADD COLUMN rangePolicy ENUM('enforce', 'soft', 'open') NULL;`);
        } catch(error) {
            console.log('rangePolicy column may already exist, skipping');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query(`ALTER TABLE request DROP COLUMN rangePolicy;`);
        } catch(error) {
            console.error('Rollback error:', error);
        }

        try {
            await queryRunner.query(`ALTER TABLE request DROP COLUMN pricingMode;`);
        } catch(error) {
            console.error('Rollback error:', error);
        }

        try {
            await queryRunner.query(`ALTER TABLE request DROP COLUMN costMax;`);
        } catch(error) {
            console.error('Rollback error:', error);
        }

        try {
            await queryRunner.query(`ALTER TABLE request DROP COLUMN costMin;`);
        } catch(error) {
            console.error('Rollback error:', error);
        }
    }

}
