import {MigrationInterface, QueryRunner} from "typeorm";

export class customerRatingAggregate1731394800000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add rating and reviewCount columns to rider (customer) table
        try {
            await queryRunner.query('ALTER TABLE rider ADD COLUMN rating TINYINT NULL;');
        } catch(error) {}
        try {
            await queryRunner.query('ALTER TABLE rider ADD COLUMN reviewCount INT NOT NULL DEFAULT 0;');
        } catch(error) {}

        // Create driver_review table for drivers rating customers
        try {
            await queryRunner.query(`
                CREATE TABLE driver_review (
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
        } catch(error) {}

        // Add index for faster rating queries
        try {
            await queryRunner.query('CREATE INDEX IDX_driver_review_customer ON driver_review(customerId);');
        } catch(error) {}
        try {
            await queryRunner.query('CREATE INDEX IDX_driver_review_driver ON driver_review(driverId);');
        } catch(error) {}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query('DROP TABLE IF EXISTS driver_review;');
        } catch(error) {}
        try {
            await queryRunner.query('ALTER TABLE rider DROP COLUMN reviewCount;');
        } catch(error) {}
        try {
            await queryRunner.query('ALTER TABLE rider DROP COLUMN rating;');
        } catch(error) {}
    }
}
