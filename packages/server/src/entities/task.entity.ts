import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Task {
  /**
   * 文件的唯一标识
   */
  @PrimaryColumn()
  fileKey: string;

  @Column()
  from: string;

  @Column()
  to: string;

  /**
   * 任务的状态，1 表示待处理，2 表示完成，3 表示失败
   */
  @Column()
  status: number;

  /**
   * 任务的消息，失败时记录失败原因
   */
  @Column({ nullable: true })
  msg: string;
}
