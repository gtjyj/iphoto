import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { SiteConfig } from '../../logic/site-config';
import { ResultUtils } from 'src/utils/result-utils';
import { v4 as uuidv4 } from 'uuid';
import { FileCenter } from 'src/logic/file.center';
import { getFileExtension } from 'src/utils/util';
import logger from 'src/utils/logger';
import * as sharp from 'sharp';
import { Repository } from 'typeorm';
import { Task } from 'src/entities/task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PhotoService } from '../photo/photo.service';
import { StorageType } from 'src/types/enums';

dotenv.config();

@Injectable()
export class AdminService {
  private fileCenter: FileCenter;

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private readonly photoService: PhotoService,
  ) {
    this.fileCenter = new FileCenter();
  }

  async saveConfig(key: string, value: string) {
    try {
      SiteConfig.getInstance().setValue(key, value);
    } catch (e) {
      logger.error(e);
      return ResultUtils.fail();
    }
    return ResultUtils.success();
  }

  async tryCompressFile(file: Express.Multer.File) {
    const config = SiteConfig.getInstance();

    // 获取原图尺寸和大小
    const originalMetadata = await sharp(file.buffer).metadata();
    const originalSize = (file.buffer.length / 1024).toFixed(2); // 转换为 KB
    const originalWidth = originalMetadata.width;
    const originalHeight = originalMetadata.height;

    const compressedBuffer = await sharp(file.buffer)
      .resize({
        width: Number(config.getValue('compressMaxPx')),
        height: Number(config.getValue('compressMaxPx')),
        fit: 'inside', // 保持比例，不会拉伸变形
        withoutEnlargement: true, // 如果图片小于800x800，不会放大
      })
      .jpeg({ quality: Number(config.getValue('compressQuality')) })
      .toBuffer();

    // 获取压缩图尺寸和大小
    const compressedMetadata = await sharp(compressedBuffer).metadata();
    const compressedSize = (compressedBuffer.length / 1024).toFixed(2); // 转换为 KB
    const compressedWidth = compressedMetadata.width;
    const compressedHeight = compressedMetadata.height;

    const compressedThumbBuffer = await sharp(file.buffer)
      .resize({
        width: Number(config.getValue('thumbMaxPx')),
        height: Number(config.getValue('thumbMaxPx')),
        fit: 'inside', // 保持比例，不会拉伸变形
        withoutEnlargement: true, // 如果图片小于800x800，不会放大
      })
      .jpeg({ quality: Number(config.getValue('thumbQuality')) })
      .toBuffer();

    // 获取缩略图尺寸和大小
    const thumbMetadata = await sharp(compressedThumbBuffer).metadata();
    const thumbSize = (compressedThumbBuffer.length / 1024).toFixed(2); // 转换为 KB
    const thumbWidth = thumbMetadata.width;
    const thumbHeight = thumbMetadata.height;

    return {
      original: {
        size: originalSize,
        width: originalWidth,
        height: originalHeight,
      },
      hd: {
        size: compressedSize,
        width: compressedWidth,
        height: compressedHeight,
        base64: compressedBuffer.toString('base64'),
      },
      thumb: {
        size: thumbSize,
        width: thumbWidth,
        height: thumbHeight,
        base64: compressedThumbBuffer.toString('base64'),
      },
    };
  }

  async uploadFile(file: Express.Multer.File) {
    try {
      const fileKey = `${uuidv4()}_${Date.now()}${getFileExtension(file)}`;

      await this.fileCenter.saveStaticFile(fileKey, file.buffer);
      return ResultUtils.success(
        `${process.env.API_PREFIX ? process.env.API_PREFIX + '/' : ''}photos/static/${fileKey}`,
      );
    } catch (e) {
      logger.error(e);
      return ResultUtils.fail();
    }
  }

  async migrateData(from: StorageType, to: StorageType) {
    try {
      console.log(from, to);
      // 从 photo 表查出所有的 fileKey
      const photos = await this.photoService.getPhotosByPage(
        { page: 1, pageSize: 999999 },
        ['fileKey'],
      );
      const fileKeys = photos.data.list.map((photo) => photo.fileKey);

      // 将 fileKey 写入 task 表
      const tasks = fileKeys.map((fileKey) => ({
        fileKey,
        status: 1,
        msg: '',
        from,
        to,
      }));
      await this.taskRepository.save(tasks);

      // 遍历每个 fileKey 进行迁移操作
      for (const task of tasks) {
        try {
          // 这里调用实际的迁移函数，假设为 this.performMigration
          const result = await this.fileCenter.copyPhotos(
            task.from,
            task.to,
            task.fileKey,
          );
          // 迁移成功，更新状态为 2
          await this.taskRepository.update(
            { fileKey: task.fileKey },
            { status: result ? 2 : 3 },
          );
        } catch (error) {
          // 迁移失败，更新状态为 3 并记录错误信息
          await this.taskRepository.update(
            { fileKey: task.fileKey },
            {
              status: 3,
              msg: error.message,
            },
          );
        }
      }
    } catch (error) {
      logger.error(`迁移数据时出错: ${error.message}`);
    }
  }

  /**
   * 查询 task 表中不同状态的数据数量
   * @returns 包含不同状态数据数量的对象
   */
  async getTaskStatusCount() {
    try {
      const status1Count = await this.taskRepository.count({
        where: { status: 1 },
      });
      const status2Count = await this.taskRepository.count({
        where: { status: 2 },
      });
      const status3Count = await this.taskRepository.count({
        where: { status: 3 },
      });

      return ResultUtils.success({
        status1: status1Count,
        status2: status2Count,
        status3: status3Count,
      });
    } catch (error) {
      logger.error(`查询 task 表状态数量时出错: ${error.message}`);
      return ResultUtils.fail('查询 task 表状态数量时出错');
    }
  }
}
