import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  Res,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotoService } from './photo.service';
import { Response } from 'express';
import { PaginationDto } from './dto/pagination.dto';
import { ResponseDto } from './dto/response.dto';
import { ResultUtils } from 'src/utils/result-utils';
import { SiteConfig, siteConfigKeys } from '../../logic/site-config';
import { PhotoDto } from './dto/photo.dto';
import { Public } from 'src/common/guard/auth.guard';
import { AntiHotlinkingGuard } from 'src/common/guard/anti-hotlinking.guard';
import * as qrcode from 'qrcode';
import logger from 'src/utils/logger';

@Controller('photos')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Get('qrcode')
  @Public()
  async getQrCode(@Res() res) {
    const domain = SiteConfig.getInstance().getValue('domain');
    try {
      const qrCodeDataUrl = await qrcode.toDataURL(domain);
      const base64Image = qrCodeDataUrl.split(';base64,').pop();
      const buffer = Buffer.from(base64Image, 'base64');

      res.set({
        'Content-Type': 'image/png',
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=3600',
        Expires: new Date(Date.now() + 3600000).toUTCString(),
      });
      res.send(buffer);
    } catch (error) {
      logger.error(error);
      res.status(500).send('Failed to generate QR code');
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<string>> {
    const allowedTypes = ['image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return ResultUtils.fail('只允许上传png和jpg文件');
    }
    return this.photoService.processUpload(file);
  }

  @Get('hd/:fileKey')
  @Public()
  @UseGuards(AntiHotlinkingGuard)
  async getCompressedPhoto(
    @Param('fileKey') fileKey: string,
    @Res() res: Response,
    @Req() req: Request, // 添加请求对象
  ) {
    const cosResponse = await this.photoService.getCompressedPhoto(fileKey);
    const lowerCaseHeaders = Object.fromEntries(
      Object.entries(cosResponse.headers).map(([key, value]) => [key.toLowerCase(), value])
    );
    const lastModified = lowerCaseHeaders['last-modified'];
    const etag = lowerCaseHeaders['etag'];
  
    const lowerCaseReqHeaders = Object.fromEntries(
      Object.entries(req.headers).map(([key, value]) => [key.toLowerCase(), value])
    );
  
    // 检查缓存头，忽略大小写
    if (
      lowerCaseReqHeaders['if-modified-since'] === lastModified ||
      lowerCaseReqHeaders['if-none-match'] === etag
    ) {
      return res.status(304).send();
    }
  
    // 设置响应头
    for (const [key, value] of Object.entries(cosResponse.headers)) {
      res.setHeader(key, value);
    }
    // 将文件内容发送给前端
    res.send(cosResponse.buffer);
  }

  @Get('image/:fileKey')
  @Public()
  @UseGuards(AntiHotlinkingGuard)
  async getThumbPhoto(
    @Param('fileKey') fileKey: string,
    @Res() res: Response,
    @Req() req: Request, // 添加请求对象
  ) {
    const file = await this.photoService.getThumbPhoto(fileKey);
    const lowerCaseHeaders = Object.fromEntries(
      Object.entries(file.headers).map(([key, value]) => [key.toLowerCase(), value])
    );
    const lastModified = lowerCaseHeaders['last-modified'];
    const etag = lowerCaseHeaders['etag'];
  
    const lowerCaseReqHeaders = Object.fromEntries(
      Object.entries(req.headers).map(([key, value]) => [key.toLowerCase(), value])
    );
  
    // 检查缓存头，忽略大小写
    if (
      lowerCaseReqHeaders['if-modified-since'] === lastModified ||
      lowerCaseReqHeaders['if-none-match'] === etag
    ) {
      return res.status(304).send();
    }
  
    // 设置响应头
    for (const [key, value] of Object.entries(file.headers)) {
      res.setHeader(key, value);
    }
    // 将文件内容发送给前端
    res.send(file.buffer);
  }

  @Get('static/:fileKey')
  @Public()
  @UseGuards(AntiHotlinkingGuard)
  async getStatic(
    @Param('fileKey') fileKey: string,
    @Res() res: Response,
    @Req() req: Request, // 添加请求对象
  ) {
    const cosResponse = await this.photoService.getStatic(fileKey);
    const lowerCaseHeaders = Object.fromEntries(
      Object.entries(cosResponse.headers).map(([key, value]) => [key.toLowerCase(), value])
    );
    const lastModified = lowerCaseHeaders['last-modified'];
    const etag = lowerCaseHeaders['etag'];
  
    const lowerCaseReqHeaders = Object.fromEntries(
      Object.entries(req.headers).map(([key, value]) => [key.toLowerCase(), value])
    );
  
    // 检查缓存头，忽略大小写
    if (
      lowerCaseReqHeaders['if-modified-since'] === lastModified ||
      lowerCaseReqHeaders['if-none-match'] === etag
    ) {
      return res.status(304).send();
    }
  
    // 设置响应头
    for (const [key, value] of Object.entries(cosResponse.headers)) {
      res.setHeader(key, value);
    }
    // 将文件内容发送给前端
    res.send(cosResponse.buffer);
  }

  @Post('items')
  @Public()
  async getPhotosByPage(
    @Body() paginationDto: PaginationDto,
  ): Promise<ResponseDto<{ list: Partial<PhotoDto>[]; total: number }>> {
    return this.photoService.getPhotosByPage(paginationDto, [
      'fileKey',
      'direction',
    ]);
  }

  @Post('siteConfig')
  async getConfig() {
    const cfgInstance = SiteConfig.getInstance();
    return ResultUtils.success(cfgInstance.getValue(siteConfigKeys));
  }

  @Post('delete')
  async saveConfig(@Body('fileKey') fileKey: string) {
    return await this.photoService.delete(fileKey);
  }
}
