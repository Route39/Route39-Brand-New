import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AnnouncementNotificationSentAt1763232548000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'promotion',
      new TableColumn({
        name: 'notificationSentAt',
        type: 'datetime',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('promotion', 'notificationSentAt');
  }
}
