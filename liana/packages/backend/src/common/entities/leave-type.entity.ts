import { LeaveTypeCode } from '@liana/shared';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { LeaveRequestEntity } from './leave-request.entity';

@Entity('leave_types')
export class LeaveTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: LeaveTypeCode, unique: true })
  code!: LeaveTypeCode;

  @Column()
  name!: string;

  @Column({ default: true })
  paid!: boolean;

  @OneToMany(() => LeaveRequestEntity, (request) => request.leaveType)
  requests?: LeaveRequestEntity[];
}
