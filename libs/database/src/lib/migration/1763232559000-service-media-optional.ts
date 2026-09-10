import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ServiceMediaOptional1763232559000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'service',
      'mediaId',
      new TableColumn({
        name: 'mediaId',
        type: 'int',
        isNullable: true,
        comment: 'Optional service icon/image (Media relation)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'service',
      'mediaId',
      new TableColumn({
        name: 'mediaId',
        type: 'int',
        isNullable: false,
      }),
    );
  }
}