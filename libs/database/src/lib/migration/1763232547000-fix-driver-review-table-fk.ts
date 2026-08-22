import {MigrationInterface, QueryRunner} from "typeorm";

export class FixDriverReviewTableFk1763232547000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fix for migration 1731394800000 which incorrectly referenced table 'taxi_order' instead of 'request'
        // Drop the existing driver_review table if it exists (it might have been created incorrectly or failed)
        try {
            await queryRunner.query('DROP TABLE IF EXISTS driver_review;');
        } catch(error) {
            console.log('driver_review table may not exist, continuing...');
        }

        // Create driver_review table with correct foreign key reference to 'request' table
        try {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS driver_review (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    score TINYINT NOT NULL,
                    review VARCHAR(255) NULL,
                    driverId INT NOT NULL,
                    customerId INT NOT NULL,
                    orderId INT NOT NULL,
                    reviewTimestamp DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
                    CONSTRAINT FK_driver_review_driver FOREIGN KEY (driverId) REFERENCES driver(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                    CONSTRAINT FK_driver_review_customer FOREIGN KEY (customerId) REFERENCES rider(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                    CONSTRAINT FK_driver_review_order FOREIGN KEY (orderId) REFERENCES request(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                    UNIQUE KEY UK_driver_review_order (orderId)
                );
            `);
        } catch(error) {
            console.error('Error creating driver_review table:', error);
        }

        // Add indexes for faster rating queries
        try {
            await queryRunner.query('CREATE INDEX IF NOT EXISTS IDX_driver_review_customer ON driver_review(customerId);');
        } catch(error) {
            console.log('Index IDX_driver_review_customer may already exist, skipping');
        }

        try {
            await queryRunner.query('CREATE INDEX IF NOT EXISTS IDX_driver_review_driver ON driver_review(driverId);');
        } catch(error) {
            console.log('Index IDX_driver_review_driver may already exist, skipping');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query('DROP TABLE IF EXISTS driver_review;');
        } catch(error) {
            console.error('Rollback error:', error);
        }
    }

}
