import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Point } from '../../interfaces/point';
import { PolygonTransformer } from '../../transformers/polygon.transformer';

@Entity('surge_zone')
export class SurgeZoneEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('varchar')
  name!: string;

  @Column('polygon', { transformer: new PolygonTransformer() })
  area!: Point[][];

  // Active | Off | Auto
  @Column('varchar', { default: 'Off' })
  status!: string;

  @Column({ default: false })
  autoLive!: boolean;

  @Column('varchar', { nullable: true })
  autoReason?: string | null;

  @Column({ default: false })
  autoCreated!: boolean;

  @Column('int', { nullable: true })
  regionId?: number | null;

  // Peak | Rain | Festival | Night | Event
  @Column('varchar', { default: 'Peak' })
  type!: string;

  @Column('float', { nullable: true, precision: 10, scale: 2 })
  surgePercent?: number | null;

  @Column('float', { nullable: true, precision: 10, scale: 2 })
  surgeFlat?: number | null;

  @Column('float', { nullable: true, precision: 10, scale: 2 })
  commissionPercent?: number | null;

  @Column('varchar', { nullable: true, length: 5 })
  startTime?: string | null;

  @Column('varchar', { nullable: true, length: 5 })
  endTime?: string | null;

  @Column('varchar', { nullable: true, length: 10 })
  startDate?: string | null;

  @Column('varchar', { nullable: true, length: 10 })
  endDate?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
