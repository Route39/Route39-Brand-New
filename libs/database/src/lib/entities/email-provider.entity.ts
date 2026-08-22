import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmailProviderType } from './enums/email-provider-type.enum';
import { EmailEntity } from './email.entity';

@Entity('email_provider')
export class EmailProviderEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: EmailProviderType,
  })
  type!: EmailProviderType;

  @Column({
    default: false,
  })
  isDefault!: boolean;

  @Column()
  name!: string;

  @Column({
    nullable: true,
  })
  apiKey?: string;

  @Column({
    nullable: true,
  })
  fromEmail?: string;

  @Column({
    nullable: true,
  })
  fromName?: string;

  @Column({
    nullable: true,
  })
  replyToEmail?: string;

  @CreateDateColumn({ nullable: true })
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => EmailEntity, (email) => email.provider)
  emails!: EmailEntity[];
}
