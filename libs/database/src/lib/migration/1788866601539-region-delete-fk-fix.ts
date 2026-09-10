import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fixes "Cannot delete or update a parent row: a foreign key constraint
 * fails" errors when deleting a Region from the admin panel.
 *
 * The `region` row is referenced by several foreign keys (join tables for
 * Service<->Region and ShopTaxRule<->Region, plus TaxiOrder.regionId).
 * Those FKs were created without an ON DELETE action, so MySQL defaults to
 * RESTRICT and blocks the delete.
 *
 * This migration re-creates each FK that points at `region`.`id`:
 *  - join-table columns (regionId on a many-to-many junction table) get
 *    ON DELETE CASCADE, since the join row is meaningless once the region
 *    is gone.
 *  - TaxiOrder.regionId gets ON DELETE SET NULL, so historical order data
 *    is preserved and only unlinked from the deleted region.
 *
 * It looks up the live constraint name for each (table, column) pair via
 * INFORMATION_SCHEMA instead of hardcoding it, since MySQL generates a
 * unique hashed constraint name per database.
 */
export class regionDeleteFkFix1788866601539 implements MigrationInterface {
  private async setOnDelete(
    queryRunner: QueryRunner,
    table: string,
    column: string,
    onDelete: 'CASCADE' | 'SET NULL',
  ): Promise<void> {
    try {
      const rows: Array<{
        CONSTRAINT_NAME: string;
        REFERENCED_TABLE_NAME: string;
      }> = await queryRunner.query(
        `SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME
         FROM information_schema.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?
           AND REFERENCED_TABLE_NAME = 'region'`,
        [table, column],
      );

      if (!rows || rows.length === 0) {
        // Table/column/FK doesn't exist in this database (e.g. feature
        // not installed, or already fixed) - nothing to do.
        return;
      }

      const constraintName = rows[0].CONSTRAINT_NAME;

      await queryRunner.query(
        `ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${constraintName}\``,
      );
      await queryRunner.query(
        `ALTER TABLE \`${table}\`
         ADD CONSTRAINT \`${constraintName}\`
         FOREIGN KEY (\`${column}\`) REFERENCES \`region\` (\`id\`)
         ON DELETE ${onDelete} ON UPDATE NO ACTION`,
      );
    } catch (error) {
      // Non-fatal: log and continue with the other constraints so one
      // unexpected schema shape doesn't block the whole migration.
      console.error(
        `region-delete-fk-fix: could not update FK on ${table}.${column}`,
        error,
      );
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Service <-> Region join table
    await this.setOnDelete(
      queryRunner,
      'service_regions_region',
      'regionId',
      'CASCADE',
    );

    // ShopTaxRule <-> Region join table
    await this.setOnDelete(
      queryRunner,
      'shop_tax_rule_regions_region',
      'regionId',
      'CASCADE',
    );

    // TaxiOrder.regionId is nullable and historical - unlink, don't cascade delete orders
    await this.setOnDelete(queryRunner, 'taxi_order', 'regionId', 'SET NULL');
  }

  public async down(): Promise<void> {
    // Intentionally left as a no-op: reverting to the restrictive
    // (no ON DELETE action) behaviour would just reintroduce the bug
    // this migration fixes.
  }
}