import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmployeeEntity } from './employee.entity';

export enum PunchType {
  CHECK_IN = 'check_in',
  BREAK_START = 'break_start',
  BREAK_END = 'break_end',
  CHECK_OUT = 'check_out',
}

@Entity('punches')
export class PunchEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  employeeId!: string;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.punches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employeeId' })
  employee!: EmployeeEntity;

  @Column({ type: 'varchar', length: 32 })
  type!: PunchType;

  @Column({ type: 'datetime' })
  punchedAt!: Date;

  @Column({ type: 'longblob', nullable: true })
  photoBlob?: Buffer;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: string;

  @Column({ default: 'web' })
  source!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
