import { IFile } from 'src/types/IFile';
import { FileAccessInterface } from './file.access.interface';
import {
  readFileSync,
  writeFileSync,
  unlinkSync,
  statSync,
  existsSync,
  mkdirSync,
} from 'fs';
import { dirname, join, resolve } from 'path';
import logger from 'src/utils/logger';
import * as crypto from 'crypto'; // 引入 crypto 模块用于生成 ETag

const rootDir = resolve(process.env.ROOT_DIR + '/userdata/');

export class DiskFileSystem implements FileAccessInterface {
  async getFile(key: string): Promise<IFile> {
    try {
      const filePath = join(rootDir, key);
      const buffer = readFileSync(filePath);
      // 获取文件的状态信息，用于获取最后修改时间
      const stats = statSync(filePath);
      const lastModified = stats.mtime.toUTCString();
      // 假设过期时间为 1 小时后
      const expires = new Date(Date.now() + 3600000).toUTCString();
      // 生成 ETag
      const hash = crypto.createHash('md5').update(buffer).digest('hex');
      const etag = `"${hash}"`;

      return {
        fileKey: key,
        headers: {
          'Last-Modified': lastModified,
          ETag: etag, // 添加 ETag 字段
          Expires: expires,
          'Cache-Control': 'public, max-age=3600',
        },
        buffer: buffer,
      };
    } catch (e) {
      logger.error('本地文件读取错误', key, e);
      throw e;
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const filePath = join(rootDir, key);
      unlinkSync(filePath);
      return true;
    } catch (e) {
      logger.error('本地文件删除错误', key, e);
      throw e;
    }
  }

  async saveFile(key: string, body: Buffer): Promise<boolean> {
    try {
      const filePath = join(rootDir, key);
      // 获取文件所在的目录路径
      const dirPath = dirname(filePath);
      // 检查目录是否存在，如果不存在则创建
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }
      writeFileSync(filePath, body);
      return true;
    } catch (e) {
      logger.error('本地文件写入错误', key, e);
      throw e;
    }
  }
}
