import {MigrationInterface, QueryRunner} from "typeorm";

export class FixCustomerRatingAggregateColumnNames1763232546000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop incorrect column names if they exist
        try {
            await queryRunner.query('ALTER TABLE rider DROP COLUMN rating;');
        } catch(error) {}
        try {
            await queryRunner.query('ALTER TABLE rider DROP COLUMN reviewCount;');
        } catch(error) {}

        // Rename ratingAggregateReviewcount to ratingAggregateReviewCount (fix casing)
        try {
            await queryRunner.query('ALTER TABLE rider CHANGE COLUMN ratingAggregateReviewcount ratingAggregateReviewCount INT NOT NULL DEFAULT 0;');
        } catch(error) {}

        // Add ratingAggregateRating if it doesn't exist
        try {
            await queryRunner.query('ALTER TABLE rider ADD COLUMN ratingAggregateRating TINYINT NULL;');
        } catch(error) {}

        // Add ratingAggregateReviewCount if it doesn't exist (in case the rename failed)
        try {
            await queryRunner.query('ALTER TABLE rider ADD COLUMN ratingAggregateReviewCount INT NOT NULL DEFAULT 0;');
        } catch(error) {}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert changes
        try {
            await queryRunner.query('ALTER TABLE rider DROP COLUMN ratingAggregateReviewCount;');
        } catch(error) {}
        try {
            await queryRunner.query('ALTER TABLE rider DROP COLUMN ratingAggregateRating;');
        } catch(error) {}
    }
}
