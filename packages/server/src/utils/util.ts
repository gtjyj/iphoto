import { exec } from 'child_process';
import logger from './logger';
import { resolve } from 'path';
import { getSystemConfigs } from 'src/init/check.config';
// import * as sqlite3 from 'sqlite3';

export function getFileExtension(file: Express.Multer.File) {
  if (file.originalname) {
    const index = file.originalname.lastIndexOf('.');
    if (index > 0) {
      return file.originalname.substring(index);
    }
  }
  return file.mimetype.split('/')[1] ? `.${file.mimetype.split('/')[1]}` : '';
}

export function restartSystem() {
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => {
      exec('pm2 restart iphoto', (error, stdout, stderr) => {
        if (error) {
          logger.error(`重启应用时出错: ${error.message}`);
          return;
        }
        if (stderr) {
          logger.error(`重启应用时出现错误输出: ${stderr}`);
          return;
        }
        logger.info(`应用已重启: ${stdout}`);
      });
    }, 1000);
    return '修改成功, 系统正在重启, 服务将短暂中断, 如长时间无法访问请到服务器查看日志';
  } else {
    return '修改成功, 当前是开发环境请手动重启服务';
  }
}

export function getDBConnConfig() {
  const config = getSystemConfigs();
  const connCfg = {
    type: config.DBTYPE as any,
    database:
      config.DBTYPE === 'sqlite'
        ? resolve(
            process.env.ROOT_DIR + `/userdata/${config.INSTANCE_ID}.sqlite`,
          )
        : config.DB_NAME,
    // 根据DBTYPE设置不同配置
    ...(config.DBTYPE === 'mysql' && {
      host: config.DB_MYSQL,
      port: parseInt(config.DB_PORT),
      username: config.DB_USER,
      password: config.DB_PASS,
    }),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true,

    // SQLite特定配置
    ...(config.DBTYPE === 'sqlite' && {
      // driver: sqlite3.Database,
      // enableWAL: true, // 提高写入性能
      busyTimeout: 5000,
      // 添加日期类型处理
      dateStrings: true, // 返回日期字符串而不是 Date 对象
      extra: {
        // 确保日期格式正确
        options: {
          typeCast: function (field: any, next: any) {
            if (field.type === 'DATETIME') {
              return field.string();
            }
            return next();
          },
        },
      },
    }),
  };
  console.log('数据库连接信息', connCfg);
  return connCfg;
}
