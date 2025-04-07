import { DataSource } from 'typeorm';
import { resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';
import { InitInputs, SystemConfig } from 'src/types/system.config';
import { readFileSync } from 'fs';
import logger from 'src/utils/logger';
import { getDBConnConfig } from 'src/utils/util';

const configPath = resolve(process.env.ROOT_DIR + '/userdata/config.json');
let configs;

function checkParamsRequire(
  params: SystemConfig,
  initData: InitInputs,
): boolean {
  for (const item of initData) {
    if (!item.require) continue;
    if (item.when?.length) {
      if (
        item.when.every((whenItem: any) => {
          return params[whenItem.key] === whenItem.value;
        })
      ) {
        return !(
          params[item.key] === undefined ||
          params[item.key] === null ||
          params[item.key] === ''
        );
      }
    } else {
      return !(
        params[item.key] === undefined ||
        params[item.key] === null ||
        params[item.key] === ''
      );
    }
  }
  return true;
}

async function checkDBisValid(params: SystemConfig): Promise<boolean> {
  const { DBTYPE, DB_NAME, INSTANCE_ID } = params;

  if (DBTYPE === 'sqlite') {
    // SQLite不需要连接检查，只需确保文件存在
    const dbPath = resolve(
      process.env.ROOT_DIR + `/userdata/${INSTANCE_ID}.sqlite`,
    );
    if (!existsSync(dbPath)) {
      writeFileSync(dbPath, ''); // 创建空数据库文件
    }
    return true;
  }

  // 原有MySQL检查逻辑保持不变
  const dataSource = new DataSource(getDBConnConfig());
  try {
    await dataSource.initialize();
    const queryRunner = dataSource.createQueryRunner();
    const databases = await queryRunner.query('SHOW DATABASES');
    const databaseExists = databases.some((db) => db.Database === DB_NAME);
    if (!databaseExists) {
      await queryRunner.query(`CREATE DATABASE ${DB_NAME}`);
    }
    await dataSource.destroy();
    return true;
  } catch (error) {
    logger.error('数据库连接失败:', error);
    return false;
  }
}

function getSystemConfigs(): Partial<SystemConfig> {
  if (configs) return configs;
  try {
    if (!existsSync(configPath)) return {};
    const data = readFileSync(configPath, 'utf8');
    configs = JSON.parse(data);
    return configs;
  } catch (error) {
    logger.error('读取配置文件失败:', error);
    return null;
  }
}

async function setSystemConfigs(data: SystemConfig) {
  try {
    const mergeData = { ...configs, ...data };
    writeFileSync(configPath, JSON.stringify(mergeData, null, 2));
    configs = mergeData;
    logger.info('配置文件写入成功');
  } catch (error) {
    logger.error('配置文件写入失败:', error);
  }
}

export {
  getSystemConfigs,
  setSystemConfigs,
  checkParamsRequire,
  checkDBisValid,
  configPath,
};
