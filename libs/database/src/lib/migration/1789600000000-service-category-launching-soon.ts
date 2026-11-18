// 1789600000000-service-category-launching-soon.ts
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ServiceCategoryLaunchingSoon1789600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('service_category', 'showLaunchingSoon')) return;
    await queryRunner.addColumn(
      'service_category',
      new TableColumn({
        name: 'showLaunchingSoon',
        type: 'boolean',
        isNullable: false,
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('service_category', 'showLaunchingSoon');
  }
}