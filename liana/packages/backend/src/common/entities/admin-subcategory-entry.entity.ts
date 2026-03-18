import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('admin_subcategory_entries')
export class AdminSubcategoryEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  subcategory!: string;

  @Column({ type: 'simple-json' })
  data!: Record<string, string>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
