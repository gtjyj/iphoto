import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

// 自定义函数，生成带时区的时间戳
function getLocalTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

class Logger {
  private logger: winston.Logger;
  private logPath: string;
  constructor() {
    this.logPath = process.env.ROOT_DIR + '/userdata/logs/';
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format((info) => {
          info.timestamp = getLocalTimestamp();
          return info;
        })(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} ${level}: ${message}`;
        }),
      ),
      transports: [
        new DailyRotateFile({
          filename: this.logPath + '%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '1m',
          maxFiles: '7d',
        }),
        new winston.transports.Console(),
      ],
    });
  }

  public getDirPath() {
    return this.logPath;
  }

  public info(...args: any[]): void {
    const message = args.map((arg) => String(arg)).join(' ');
    this.logger.info(message);
  }

  public warn(...args: any[]): void {
    const message = args.map((arg) => String(arg)).join(' ');
    this.logger.warn(message);
  }

  public error(...args: any[]): void {
    const message = args.map((arg) => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack}`;
      }
      return String(arg);
    }).join(' ');
    this.logger.error('【错误】:' + message);
  }

  public debug(...args: any[]): void {
    const message = args.map((arg) => String(arg)).join(' ');
    this.logger.debug(message);
  }
}

export default new Logger();
