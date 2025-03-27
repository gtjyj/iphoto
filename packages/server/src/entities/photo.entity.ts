import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fileKey: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'int' })
  width: number;

  @Column({ type: 'int' })
  height: number;

  @Column({ type: 'varchar', length: 20 })
  direction: string;

  @Column({ type: 'varchar', length: 20 })
  orientation: string;

  @Column()
  originalDate: string;

  @Column()
  createDate: string;

  @Column()
  modifyDate: string;

  @Column()
  gpsLatitude: string;

  @Column()
  gpsLongitude: string;

  @Column()
  fileSize: number;

  @Column({ nullable: true }) // 新增字段
  originalFileName: string;
}
