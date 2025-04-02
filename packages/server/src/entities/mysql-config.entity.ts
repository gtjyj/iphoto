import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class MysqlConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @Column()
  value: string;
}
