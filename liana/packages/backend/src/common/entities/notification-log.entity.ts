import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notification_logs')
export class NotificationLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  channel!: string;

  @Column()
  recipient!: string;

  @Column()
  subject!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ nullable: true })
  actionPath?: string;

  @Column({ default: 'queued' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
