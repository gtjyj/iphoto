import { exec } from 'child_process';
import logger from './logger';

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
