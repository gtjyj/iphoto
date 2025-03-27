import { IFile } from 'src/types/IFile';
import { FileAccessInterface } from './file.access.interface';
import { CosAccessType, StorageType } from 'src/types/enums';
import { TencentCosFileSystem } from './file.tencent.cos';
import { getSystemConfigs } from 'src/init/check.config';
import { PhotoDto } from 'src/modules/photo/dto/photo.dto';
import { DiskFileSystem } from './file.disk';
import { AliyunOssFileSystem } from './file.aliyun.oss';
import { WebDAVFileSystem } from './file.webdav';
import logger from 'src/utils/logger';
import { SiteConfig } from './site-config';
const systemConfig = getSystemConfigs();
export class FileCenter {
  private fileCenter: FileAccessInterface = null;

  constructor() {
    this.fileCenter = this.getFileSystem(systemConfig.STORAGE);
  }

  private getFileSystem(storageType: StorageType): FileAccessInterface {
    switch (storageType) {
      case StorageType.TENCENT_COS:
        return new TencentCosFileSystem();
      case StorageType.FILE_SYSTEM:
        return new DiskFileSystem();
      case StorageType.ALIYUN_COS:
        return new AliyunOssFileSystem();
      case StorageType.WEBDAV:
        return new WebDAVFileSystem();
      default:
        throw new Error(`不支持的存储类型: ${storageType}`);
    }
  }

  async getStaticFile(key: string): Promise<IFile> {
    return this.fileCenter.getFile(this.getStaticKey(key));
  }

  async getThumbFile(key: string): Promise<IFile> {
    return this.fileCenter.getFile(this.getThumKey(key));
  }

  async getCompressedFile(key: string): Promise<IFile> {
    return this.fileCenter.getFile(this.getCompressedKey(key));
  }

  async getOriginalFile(key: string): Promise<IFile> {
    return this.fileCenter.getFile(this.getOriginalKey(key));
  }

  async saveStaticFile(key: string, body: Buffer): Promise<boolean> {
    return this.fileCenter.saveFile(this.getStaticKey(key), body);
  }

  async saveThumbFile(key: string, body: Buffer): Promise<boolean> {
    return this.fileCenter.saveFile(this.getThumKey(key), body);
  }

  async saveCompressedFile(key: string, body: Buffer): Promise<boolean> {
    return this.fileCenter.saveFile(this.getCompressedKey(key), body);
  }

  async saveOriginalFile(key: string, body: Buffer): Promise<boolean> {
    return this.fileCenter.saveFile(this.getOriginalKey(key), body);
  }

  async deleteStaticFile(key: string): Promise<boolean> {
    return this.fileCenter.deleteFile(this.getStaticKey(key));
  }

  async deleteThumbFile(key: string): Promise<boolean> {
    return this.fileCenter.deleteFile(this.getThumKey(key));
  }

  async deleteCompressdFile(key: string): Promise<boolean> {
    return this.fileCenter.deleteFile(this.getCompressedKey(key));
  }

  async deleteOriginalFile(key: string): Promise<boolean> {
    return this.fileCenter.deleteFile(this.getOriginalKey(key));
  }

  private getStaticKey(key: string) {
    return `${systemConfig.INSTANCE_ID}/static/${key}`;
  }

  private getThumKey(key: string) {
    return `${systemConfig.INSTANCE_ID}/thumb/${key}`;
  }

  private getCompressedKey(key: string) {
    return `${systemConfig.INSTANCE_ID}/compressed/${key}`;
  }

  private getOriginalKey(key: string) {
    return `${systemConfig.INSTANCE_ID}/originals/${key}`;
  }

  async copyPhotos(
    fromStorage: StorageType,
    toStorage: StorageType,
    fileKey: string,
  ): Promise<boolean> {
    try {
      const fromFileSystem = this.getFileSystem(fromStorage);
      const toFileSystem = this.getFileSystem(toStorage);

      const originalKey = this.getOriginalKey(fileKey);
      const compressKey = this.getCompressedKey(fileKey);
      const thumbKey = this.getThumKey(fileKey);

      try {
        const origin = await fromFileSystem.getFile(originalKey);
        if (origin) {
          await toFileSystem.saveFile(originalKey, origin.buffer);
        }
        const compress = await fromFileSystem.getFile(compressKey);
        if (compress) {
          await toFileSystem.saveFile(compressKey, compress.buffer);
        }
        const thumb = await fromFileSystem.getFile(thumbKey);
        if (thumb) {
          await toFileSystem.saveFile(thumbKey, thumb.buffer);
        }
      } catch (e) {
        logger.error(e);
        return false;
      }
      return true;
    } catch (error) {
      logger.error(error);
      return false;
    }
  }

  async copyStatic(
    fromStorage: StorageType,
    toStorage: StorageType,
  ): Promise<boolean> {
    try {
      const fromFileSystem = this.getFileSystem(fromStorage);
      const toFileSystem = this.getFileSystem(toStorage);

      const datas: any = SiteConfig.getInstance().getValue([
        'icon',
        'header',
        'avatar',
      ]);
      const iconKey = this.getStaticKey(datas.icon);
      const headerKey = this.getStaticKey(datas.header);
      const avatarKey = this.getStaticKey(datas.avatar);

      try {
        const icon = await fromFileSystem.getFile(iconKey);
        if (icon) {
          await toFileSystem.saveFile(iconKey, icon.buffer);
        }
        const header = await fromFileSystem.getFile(headerKey);
        if (header) {
          await toFileSystem.saveFile(headerKey, header.buffer);
        }
        const avatar = await fromFileSystem.getFile(avatarKey);
        if (avatar) {
          await toFileSystem.saveFile(avatarKey, avatar.buffer);
        }
      } catch (e) {
        logger.error(e);
        return false;
      }
      return true;
    } catch (error) {
      logger.error(error);
      return false;
    }
  }

  setCosUrl(photos: PhotoDto[]): PhotoDto[] {
    if (
      systemConfig.STORAGE === StorageType.TENCENT_COS &&
      systemConfig.COS_ACCESS_TYPE === CosAccessType.DIRECT
    ) {
      return photos.map((item) => {
        let url = '';
        if (systemConfig.COS_ACCESS_URL) {
          url = systemConfig.COS_ACCESS_URL;
        } else {
          url = `https://${systemConfig.COS_BUCKET}.cos.${systemConfig.COS_REGION}.myqcloud.com`;
        }
        item.cos = `${url}/${systemConfig.INSTANCE_ID}/thumb/${item.fileKey}`;
        item.cosHD = `${url}/${systemConfig.INSTANCE_ID}/compressed/${item.fileKey}`;
        return item;
      });
    } else if (
      systemConfig.STORAGE === StorageType.ALIYUN_COS &&
      systemConfig.ALI_COS_ACCESS_TYPE === CosAccessType.DIRECT
    ) {
      return photos.map((item) => {
        let url = '';
        if (systemConfig.ALI_COS_ACCESS_URL) {
          url = systemConfig.ALI_COS_ACCESS_URL;
        } else {
          url = `https://${systemConfig.COS_BUCKET}.${systemConfig.COS_REGION}.aliyuncs.com`;
        }
        item.cos = `${url}/${systemConfig.INSTANCE_ID}/thumb/${item.fileKey}`;
        item.cosHD = `${url}/${systemConfig.INSTANCE_ID}/compressed/${item.fileKey}`;
        return item;
      });
    }
    return photos;
  }
}
