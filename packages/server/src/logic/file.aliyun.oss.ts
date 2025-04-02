import { IFile } from 'src/types/IFile';
import { FileAccessInterface } from './file.access.interface';
import * as OSS from 'ali-oss';
import { getSystemConfigs } from 'src/init/check.config';
import logger from 'src/utils/logger';

const systemConfig = getSystemConfigs();

export class AliyunOssFileSystem implements FileAccessInterface {
  private client: OSS;
  private bucket = systemConfig.ALI_COS_BUCKET;
  private region = systemConfig.ALI_COS_REGION;

  constructor() {
    this.client = new OSS({
      region: this.region,
      accessKeyId: systemConfig.ALI_COS_SECRET_ID,
      accessKeySecret: systemConfig.ALI_COS_SECRET_KEY,
      bucket: this.bucket,
    });
  }

  async getFile(key: string): Promise<IFile> {
    try {
      const response = await this.client.get(key);
      const expires = new Date(Date.now() + 3600000).toUTCString();
      return {
        fileKey: key,
        headers: {
          ...response.res.headers,
          Expires: expires,
          'Cache-Control': 'public, max-age=3600',
        },
        buffer: response.content,
      };
    } catch (e) {
      logger.error('oss 读取错误', key, e);
      throw e;
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      await this.client.delete(key);
      return true;
    } catch (e) {
      logger.error('oss 删除错误', key, e);
      throw e;
    }
  }

  async saveFile(key: string, body: Buffer): Promise<boolean> {
    try {
      await this.client.put(key, body);
      return true;
    } catch (e) {
      logger.error('oss 写入错误', key, e);
      throw e;
    }
  }
}
