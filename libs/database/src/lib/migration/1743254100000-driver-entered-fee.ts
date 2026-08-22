import {MigrationInterface, QueryRunner} from "typeorm";

export class driverEnteredFee1743254100000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // Add WaitingForDriverFee to the order status enum
            await queryRunner.query(`ALTER TABLE request MODIFY COLUMN status ENUM('Requested', 'NotFound', 'NoCloseFound', 'Found', 'DriverAccepted', 'Arrived', 'WaitingForPrePay', 'DriverCanceled', 'RiderCanceled', 'Started', 'WaitingForDriverFee', 'WaitingForPostPay', 'WaitingForReview', 'Finished', 'Booked', 'Expired') NOT NULL DEFAULT 'Requested';`);

            // Add driverEnteredFee column to request table
            await queryRunner.query(`ALTER TABLE request ADD COLUMN driverEnteredFee FLOAT(10,2) NULL;`);
        } catch(error) {
            console.error('Migration error:', error);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            // Remove driverEnteredFee column
            await queryRunner.query(`ALTER TABLE request DROP COLUMN driverEnteredFee;`);

            // Revert status enum to previous values
            await queryRunner.query(`ALTER TABLE request MODIFY COLUMN status ENUM('Requested', 'NotFound', 'NoCloseFound', 'Found', 'DriverAccepted', 'Arrived', 'WaitingForPrePay', 'DriverCanceled', 'RiderCanceled', 'Started', 'WaitingForPostPay', 'WaitingForReview', 'Finished', 'Booked', 'Expired') NOT NULL DEFAULT 'Requested';`);
        } catch(error) {
            console.error('Rollback error:', error);
        }
    }

}
