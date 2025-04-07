import { getSystemConfigs } from 'src/init/check.config';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
const config = getSystemConfigs();
@Entity()
export class MysqlConfig {
  @PrimaryGeneratedColumn(
    config.DBTYPE === 'sqlite'
      ? {
          type: 'integer',
          name: 'rowid',
        }
      : {},
  )
  id: number;

  @Column()
  key: string;

  @Column()
  value: string;
}
