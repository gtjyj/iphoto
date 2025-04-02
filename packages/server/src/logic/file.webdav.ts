import { IFile } from 'src/types/IFile';
import { FileAccessInterface } from './file.access.interface';
import { createClient } from 'webdav';
import { getSystemConfigs } from 'src/init/check.config';
import logger from 'src/utils/logger';
import * as crypto from 'crypto';
const systemConfig = getSystemConfigs();

export class WebDAVFileSystem implements FileAccessInterface {
  private client: any;

  constructor() {
    this.client = createClient(systemConfig.WEBDAV_URL, {
      username: systemConfig.WEBDAV_USER,
      password: systemConfig.WEBDAV_PASSWORD,
    });
  }

  async getFile(key: string): Promise<IFile> {
    try {
      const buffer = await this.client.getFileContents(key);
      const stat = await this.client.stat(key);
      const lastModified = new Date(stat.lastmod).toUTCString();
      const expires = new Date(Date.now() + 3600000).toUTCString();
      const hash = crypto.createHash('md5').update(buffer).digest('hex');
      const etag = `"${hash}"`;

      return {
        fileKey: key,
        headers: {
          Expires: expires,
          'Last-Modified': lastModified,
          ETag: etag,
          'Cache-Control': 'public, max-age=3600',
        },
        buffer: buffer as Buffer,
      };
    } catch (e) {
      logger.error('WebDAV 文件读取错误', key, e);
      throw e;
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      await this.client.deleteFile(key);
      return true;
    } catch (e) {
      logger.error('WebDAV 文件删除错误', key, e);
      throw e;
    }
  }

  async saveFile(key: string, body: Buffer): Promise<boolean> {
    try {
      await this.client.putFileContents(key, body);
      return true;
    } catch (e) {
      logger.error('WebDAV 文件写入错误', key, e);
      throw e;
    }
  }
}
