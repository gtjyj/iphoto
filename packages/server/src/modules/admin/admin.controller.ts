import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResultUtils } from 'src/utils/result-utils';
import { PaginationDto } from '../photo/dto/pagination.dto';
import { ResponseDto } from '../photo/dto/response.dto';
import { Photo } from 'src/entities/photo.entity';
import { PhotoService } from '../photo/photo.service';
import {
  siteCompressKeys,
  SiteConfig,
  siteConfigKeys,
} from '../../logic/site-config';
import { updateStaticResource, webIsStart } from 'src/logic/web.resource';
import { join } from 'path';
import logger from 'src/utils/logger';
import { promises, readdirSync, statSync } from 'fs';
import { StorageType } from 'src/types/enums';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly photoService: PhotoService,
  ) {}

  @Post('saveConfig')
  async saveConfig(@Body('key') key: string, @Body('value') value: string) {
    if (siteConfigKeys.includes(key) || siteCompressKeys.includes(key)) {
      return this.adminService.saveConfig(key, value);
    }
    return ResultUtils.fail('非法修改');
  }

  @Post('getList')
  async getList(
    @Body() paginationDto: PaginationDto,
  ): Promise<ResponseDto<{ list: Partial<Photo>[]; total: number }>> {
    return this.photoService.getPhotosByPage(paginationDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.adminService.uploadFile(file);
  }

  @Post('getLogPath')
  async getLogPath() {
    return ResultUtils.success(logger.getDirPath());
  }

  @Post('getCompressConfig')
  async getCompressConfig() {
    const config = SiteConfig.getInstance();

    return ResultUtils.success(
      config.getValue([
        'thumbMaxPx',
        'thumbQuality',
        'compressMaxPx',
        'compressQuality',
      ]),
    );
  }

  @Post('tryCompressFile')
  @UseInterceptors(FileInterceptor('file'))
  async tryCompressFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<any>> {
    const allowedTypes = ['image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return ResultUtils.fail('只允许上传png和jpg文件');
    }
    const data = await this.adminService.tryCompressFile(file);
    return ResultUtils.success(data);
    // }
  }

  @Post('getLatestLog')
  async getLatestLog() {
    const logDir = logger.getDirPath();
    try {
      const files = readdirSync(logDir);
      const fileStats = await Promise.all(
        files.map((file) => statSync(join(logDir, file))),
      );
      const latestFile = files.reduce((prev, curr, index) => {
        return fileStats[index].mtime > fileStats[files.indexOf(prev)].mtime
          ? curr
          : prev;
      });

      const logFilePath = join(logDir, latestFile);
      const logContent = await promises.readFile(logFilePath, 'utf8');
      const logLines = logContent.split('\n');
      const last200Lines = logLines.slice(-200);

      return ResultUtils.success(last200Lines);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`读取最新日志文件时出错: ${error.message}`);
      }
      return ResultUtils.fail('读取最新日志文件时出错');
    }
  }

  @Post('syncConfigToWeb')
  async syncConfigToWeb() {
    // 执行 siteconfig 的 syncToWeb 函数
    await SiteConfig.getInstance().syncToWeb();

    // 调用 webIsStart 检查 web 服务是否启动
    const isWebRunning = await webIsStart();

    if (isWebRunning) {
      return ResultUtils.success(null, '开发模式需要手动重启 web 服务');
    } else {
      try {
        await updateStaticResource();
      } catch (error) {
        logger.error(`编译html变量出错: ${error?.message}`);
        return ResultUtils.fail('编译html变量出错');
      }
      return ResultUtils.success(null, '处理完成，刷新页面生效');
    }
  }

  @Post('migrateData')
  async migrateData(
    @Body('from') from: StorageType,
    @Body('to') to: StorageType,
  ) {
    const status = await this.adminService.getTaskStatusCount();
    if (status.data.status1 > 0) {
      return ResultUtils.fail('有任务正在执行');
    }
    this.adminService.migrateData(from, to);
    return ResultUtils.success();
  }

  @Post('getStorageType')
  async getStorageType() {
    return ResultUtils.success(Object.values(StorageType));
  }

  @Post('getTaskStatus')
  async getTaskStatus() {
    return await this.adminService.getTaskStatusCount();
  }
}
