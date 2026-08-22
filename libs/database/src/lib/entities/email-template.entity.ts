import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmailEventType } from './enums/email-event-type.enum';
import { EmailContentSource } from './enums/email-content-source.enum';

@Entity('email_template')
export class EmailTemplateEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: EmailEventType,
  })
  eventType!: EmailEventType;

  @Column()
  name!: string;

  @Column()
  subject!: string;

  @Column({
    type: 'enum',
    enum: EmailContentSource,
    default: EmailContentSource.Inline,
  })
  contentSource!: EmailContentSource;

  @Column('text', { nullable: true })
  bodyHtml?: string;

  @Column({ nullable: true })
  providerTemplateId?: string;

  @Column('text', { nullable: true })
  bodyPlainText?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  locale?: string; // For future i18n support, e.g., 'en', 'es', 'fr'

  @Column({ nullable: true, length: 500 })
  cc?: string; // Comma-separated list of CC email addresses

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
