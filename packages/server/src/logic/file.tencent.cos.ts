import { IFile } from 'src/types/IFile';
import { FileAccessInterface } from './file.access.interface';
import * as COS from 'cos-nodejs-sdk-v5';
import { getSystemConfigs } from 'src/init/check.config';
import logger from 'src/utils/logger';
const systemConfig = getSystemConfigs();

export class TencentCosFileSystem implements FileAccessInterface {
  private cos: COS;
  private bucket = systemConfig.COS_BUCKET!;
  private region = systemConfig.COS_REGION!;

  constructor() {
    this.cos = new COS({
      SecretId: systemConfig.COS_SECRET_ID!,
      SecretKey: systemConfig.COS_SECRET_KEY!,
    });
  }

  async getFile(key: string): Promise<IFile> {
    try {
      const response = await this.cos.getObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: key,
      });
      const expires = new Date(Date.now() + 3600000).toUTCString();
      return {
        fileKey: key,
        headers: {
          ...response.headers,
          Expires: expires,
          'Cache-Control': 'public, max-age=3600',
        },
        buffer: response.Body,
      };
    } catch (e) {
      logger.error('cos 读取错误', key, e);
      throw e;
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      await this.cos.deleteObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: key,
      });
      return true;
    } catch (e) {
      logger.error('cos 删除错误', key, e);
      throw e;
    }
  }

  async saveFile(key: string, body: Buffer): Promise<boolean> {
    try {
      await this.cos.putObject({
        Key: key,
        Body: body,
        Bucket: this.bucket,
        Region: this.region,
      });
      return true;
    } catch (e) {
      logger.error('cos 写入错误', key, e);
      throw e;
    }
  }
}
