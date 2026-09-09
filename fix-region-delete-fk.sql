-- Fixes "Cannot delete or update a parent row: a foreign key constraint
-- fails" when deleting a Region from the admin panel.
--
-- Run this once directly against your MySQL database (see instructions
-- below). It does NOT touch any data — it only changes the ON DELETE
-- behaviour of three foreign keys that reference `region`.`id`.

-- 1) service_regions_region.regionId -> CASCADE
--    (known constraint name, from the error message)
ALTER TABLE `service_regions_region`
  DROP FOREIGN KEY `FK_58ba035359e1a0548e6b4af5e39`;

ALTER TABLE `service_regions_region`
  ADD CONSTRAINT `FK_58ba035359e1a0548e6b4af5e39`
  FOREIGN KEY (`regionId`) REFERENCES `region` (`id`)
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- 2) shop_tax_rule_regions_region.regionId -> CASCADE
--    (constraint name looked up dynamically, since it's a random hash)
SET @constraint := (
  SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'shop_tax_rule_regions_region'
    AND COLUMN_NAME = 'regionId'
    AND REFERENCED_TABLE_NAME = 'region'
  LIMIT 1
);

SET @drop_sql := IF(@constraint IS NOT NULL,
  CONCAT('ALTER TABLE `shop_tax_rule_regions_region` DROP FOREIGN KEY `', @constraint, '`'),
  'DO 0');
PREPARE stmt FROM @drop_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_sql := IF(@constraint IS NOT NULL,
  CONCAT('ALTER TABLE `shop_tax_rule_regions_region` ADD CONSTRAINT `', @constraint, '` FOREIGN KEY (`regionId`) REFERENCES `region` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION'),
  'DO 0');
PREPARE stmt FROM @add_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) taxi_order.regionId -> SET NULL (keeps order history, just unlinks it)
SET @constraint2 := (
  SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'taxi_order'
    AND COLUMN_NAME = 'regionId'
    AND REFERENCED_TABLE_NAME = 'region'
  LIMIT 1
);

SET @drop_sql2 := IF(@constraint2 IS NOT NULL,
  CONCAT('ALTER TABLE `taxi_order` DROP FOREIGN KEY `', @constraint2, '`'),
  'DO 0');
PREPARE stmt FROM @drop_sql2;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_sql2 := IF(@constraint2 IS NOT NULL,
  CONCAT('ALTER TABLE `taxi_order` ADD CONSTRAINT `', @constraint2, '` FOREIGN KEY (`regionId`) REFERENCES `region` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION'),
  'DO 0');
PREPARE stmt FROM @add_sql2;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'region delete FK fix applied' AS result;