import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('units')
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  unitNumber!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vin!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  make!: string | null;

  @Column({ type: 'smallint', nullable: true })
  year!: number | null;

  @CreateDateColumn()
  createdAt!: Date;
}
