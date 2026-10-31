import { Column, DeleteDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { MediaEntity } from "../media.entity";
import { ServiceEntity } from "./service.entity";

@Entity('service_category')
export class ServiceCategoryEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({name: 'title'})
    name!: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ default: 0 })
    displayPriority!: number;

    @Column({ default: true })
    isEnabled!: boolean;

    @OneToOne(() => MediaEntity, { eager: true, nullable: true })
    @JoinColumn()
    media?: MediaEntity;

    @Column({ nullable: true })
    mediaId?: number;

    @OneToMany(() => ServiceEntity, service => service.category)
    services!: ServiceEntity[];

    @DeleteDateColumn()
    deletedAt?: Date;
}
