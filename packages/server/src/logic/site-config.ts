import { DataSource } from 'typeorm';
import { MysqlConfig } from '../entities/mysql-config.entity';
import { getSystemConfigs } from 'src/init/check.config';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import logger from 'src/utils/logger';
import { getDBConnConfig } from 'src/utils/util';
const systemConfig = getSystemConfigs();
// 加载 .env 文件

const { DBTYPE } = systemConfig;
if (!DBTYPE) {
  throw new Error('数据库配置错误');
}
const AppDataSource = new DataSource(getDBConnConfig());

export const siteConfigKeys = [
  'siteName',
  'avatar',
  'header',
  'desc',
  'nick',
  'domain',
  'icon',
  'keywords',
];

export const siteCompressKeys = [
  'thumbMaxPx',
  'thumbQuality',
  'compressMaxPx',
  'compressQuality',
];

export class SiteConfig {
  private static instance: SiteConfig;
  private configMap: Map<string, string> = new Map();
  private dataSource: DataSource;
  private ready: boolean = false;

  private constructor() {
    this.init();
  }

  public static getInstance(): SiteConfig {
    if (!this.instance) {
      this.instance = new SiteConfig();
    }
    return this.instance;
  }

  private async init() {
    try {
      this.dataSource = await AppDataSource.initialize();
      const configs = await this.dataSource.getRepository(MysqlConfig).find();
      configs.forEach((config) => {
        this.configMap.set(config.key, config.value);
      });

      // 检查默认值

      if (!this.configMap.has['thumbMaxPx']) {
        await this.setValue('thumbMaxPx', '300');
      }
      if (!this.configMap.has['thumbQuality']) {
        await this.setValue('thumbQuality', '80');
      }
      if (!this.configMap.has['compressMaxPx']) {
        await this.setValue('compressMaxPx', '1000');
      }
      if (!this.configMap.has['compressQuality']) {
        await this.setValue('compressQuality', '80');
      }
      this.ready = true;
    } catch (error) {
      logger.error('Error initializing data source:', error);
    }
  }

  public async isReady() {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.ready) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    });
  }

  public async syncToWeb() {
    const configObject = Object.fromEntries(this.configMap);
    const jsonFilePath = resolve(
      process.env.ROOT_DIR + '/userdata/site-config.json',
    );
    try {
      // 使用 writeFileSync 同步写入文件
      await writeFileSync(jsonFilePath, JSON.stringify(configObject, null, 2));
      logger.info(
        'Config successfully written to JSON file.',
        jsonFilePath,
        configObject,
      );
    } catch (err) {
      logger.error('Error writing config to JSON file:', err);
    }
  }

  public getValue(
    key: string | string[],
  ): string | { [prop: string]: string } | undefined {
    if (Array.isArray(key)) {
      const result: any = {};
      key.forEach((k) => (result[k] = this.configMap.get(k)));
      return result;
    }
    return this.configMap.get(key);
  }

  public async setValue(key: string, value: string): Promise<void> {
    const config = await this.dataSource
      .getRepository(MysqlConfig)
      .findOne({ where: { key } });
    if (config) {
      config.value = value;
      await this.dataSource.getRepository(MysqlConfig).save(config);
    } else {
      const newConfig = new MysqlConfig();
      newConfig.key = key;
      newConfig.value = value;
      await this.dataSource.getRepository(MysqlConfig).save(newConfig);
    }
    // 更新 configMap 变量
    this.configMap.set(key, value);
  }
}
