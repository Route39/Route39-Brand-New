import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('surge_setting')
export class SurgeSettingEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: false })
  isEnabled!: boolean;

  @Column({ default: false })
  autoSurgeEnabled!: boolean;

  @Column('float', { default: 20, precision: 10, scale: 2 })
  defaultSurgePercent!: number;

  @Column('float', { default: 50, precision: 10, scale: 2 })
  maxSurgePercent!: number;

  @Column('float', { default: 0, precision: 10, scale: 2 })
  commissionPercent!: number;

  @Column('float', { default: 3, precision: 10, scale: 2 })
  autoDemandRatio!: number;

  @Column('int', { default: 15 })
  autoWindowMinutes!: number;

  @Column({ default: true })
  notifyDrivers!: boolean;

  // highest | add
  @Column('varchar', { default: 'highest' })
  stackingMode!: string;

  @Column('int', { default: 5000 })
  notifyRadiusMeters!: number;

  @Column({ default: false })
  gridEnabled!: boolean;

  @Column('int', { default: 2000 })
  gridSizeMeters!: number;

  @Column('float', { default: 2 }) tierLowRatio!: number;
  @Column('float', { default: 3 }) tierMidRatio!: number;
  @Column('float', { default: 5 }) tierHighRatio!: number;

  @Column('float', { default: 10 }) tierLowPercent!: number;
  @Column('float', { default: 20 }) tierMidPercent!: number;
  @Column('float', { default: 30 }) tierHighPercent!: number;

  @Column('float', { default: 10 }) rainExtraPercent!: number;
}
