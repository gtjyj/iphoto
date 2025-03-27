import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';
import { Photo } from '../../entities/photo.entity';
import * as exifreader from 'exifreader';
import { ResultUtils } from '../../utils/result-utils';
import { ResponseDto } from './dto/response.dto';
import { FileCenter } from '../../logic/file.center';
import { PhotoDto } from './dto/photo.dto';
import { getFileExtension } from 'src/utils/util';
import logger from 'src/utils/logger';
import { SiteConfig } from 'src/logic/site-config';

@Injectable()
export class PhotoService {
  private fileCenter: FileCenter;

  constructor(
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
  ) {
    this.fileCenter = new FileCenter();
  }

  async processUpload(file: Express.Multer.File) {
    try {
      // 获取图片元数据
      const metadata = await sharp(file.buffer).metadata();
      const config = SiteConfig.getInstance();
      // 压缩图片
      const compressedBuffer = await sharp(file.buffer)
        .resize({
          width: Number(config.getValue('compressMaxPx')),
          height: Number(config.getValue('compressMaxPx')),
          fit: 'inside', // 保持比例，不会拉伸变形
          withoutEnlargement: true, // 如果图片小于800x800，不会放大
        })
        .jpeg({ quality: Number(config.getValue('compressQuality')) })
        .toBuffer();

      const compressedThumbBuffer = await sharp(file.buffer)
        .resize({
          width: Number(config.getValue('thumbMaxPx')),
          height: Number(config.getValue('thumbMaxPx')),
          fit: 'inside', // 保持比例，不会拉伸变形
          withoutEnlargement: true, // 如果图片小于800x800，不会放大
        })
        .jpeg({ quality: Number(config.getValue('thumbQuality')) })
        .toBuffer();

      const fileKey = `${uuidv4()}_${Date.now()}${getFileExtension(file)}`;

      // 上传原始文件
      await this.fileCenter.saveOriginalFile(fileKey, file.buffer);

      await this.fileCenter.saveCompressedFile(fileKey, compressedBuffer);

      // 上传缩略图压缩文件
      await this.fileCenter.saveThumbFile(fileKey, compressedThumbBuffer);

      // 读取EXIF数据
      const tags = exifreader.load(file.buffer);
      const originalDate = tags['DateTimeOriginal']
        ? tags['DateTimeOriginal'].description
        : '';
      const createDate = tags['CreateDate']
        ? tags['CreateDate'].description
        : '';
      const modifyDate = tags['ModifyDate']
        ? tags['ModifyDate'].description
        : '';
      const orientation = tags['Orientation']
        ? tags['Orientation'].description
        : '';
      // const width = tags['ImageWidth'] ? tags['ImageWidth'].value : null;
      // const height = tags['ImageHeight'] ? tags['ImageHeight'].value : null;
      const gpsLatitude = tags['GPSLatitude']
        ? tags['GPSLatitude'].description
        : '';
      const gpsLongitude = tags['GPSLongitude']
        ? tags['GPSLongitude'].description
        : '';
      const fileSize = file.size;

      // 保存到数据库
      const photo = new Photo();
      photo.fileKey = fileKey;
      photo.width = metadata.width;
      photo.height = metadata.height;
      // 根据宽高比判断方向：1-横向，2-竖向
      photo.direction =
        metadata.width && metadata.height && metadata.width > metadata.height
          ? '1' // 横向
          : '2'; //竖向
      photo.orientation = orientation;
      photo.originalDate = originalDate;
      photo.createDate = createDate;
      photo.modifyDate = modifyDate;
      photo.gpsLatitude = gpsLatitude;
      photo.gpsLongitude = gpsLongitude;
      photo.fileSize = fileSize;
      photo.originalFileName = file.originalname;
      await this.photoRepository.save(photo);

      return ResultUtils.success(fileKey);
    } catch (e) {
      logger.error(e);
      return ResultUtils.fail('上传失败');
    }
  }

  async getCompressedPhoto(fileKey: string) {
    return this.fileCenter.getCompressedFile(fileKey);
  }

  async getThumbPhoto(fileKey: string) {
    return this.fileCenter.getThumbFile(fileKey);
  }

  async getStatic(fileKey: string) {
    return this.fileCenter.getStaticFile(fileKey);
  }

  async getPhotosByPage(
    paginationDto: any,
    fields: (keyof Photo)[] = [],
  ): Promise<ResponseDto<{ list: Partial<PhotoDto>[]; total: number }>> {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;
      const [photos, total] = await this.photoRepository.findAndCount({
        select: fields,
        order: { id: 'DESC' },
        skip,
        take: limit,
      });
      const list: PhotoDto[] = photos;
      return ResultUtils.success({
        list: this.fileCenter.setCosUrl(list),
        total,
      });
    } catch (e) {
      logger.error(e);
      return ResultUtils.fail('查询失败');
    }
  }

  async delete(fileKey: string): Promise<ResponseDto<string>> {
    try {
      if (fileKey) {
        await this.fileCenter.deleteOriginalFile(fileKey);
        await this.fileCenter.deleteCompressdFile(fileKey);
        await this.fileCenter.deleteThumbFile(fileKey);
        await this.photoRepository.delete({ fileKey });
        logger.info('删除', fileKey);
        return ResultUtils.success('删除成功');
      } else {
        return ResultUtils.fail('fileKey缺失');
      }
    } catch (e) {
      logger.info(e);
      return ResultUtils.fail('删除失败');
    }
  }
}
