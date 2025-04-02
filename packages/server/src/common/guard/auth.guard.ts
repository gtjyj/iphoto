import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config'; // 引入 ConfigService
import { LoginService } from 'src/modules/login/login.service';
import { getSystemConfigs } from 'src/init/check.config';
import logger from 'src/utils/logger';
import { Request } from 'express';

// 定义一个元数据键，用于标记不需要验证的路由
export const IS_PUBLIC_KEY = 'isPublic';
// 定义一个装饰器，用于标记不需要验证的路由
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private loginService: LoginService, // 注入 LoginService//
    private configService: ConfigService, // 注入 ConfigService
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path;
    if (!path.startsWith('/api')) {
      return true;
    }
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const token = request.headers['authorization'];

    if (!token) {
      throw new UnauthorizedException({ code: 401, message: '缺少登录token' });
    }

    try {
      // 使用 LoginService 解密 token
      const decodedToken = this.loginService.decryptToken(token);
      // 获取过期时间
      const loginExpired = Number(getSystemConfigs().LOGIN_EXPIRED);
      if (!loginExpired) {
        throw new UnauthorizedException({
          code: 401,
          message: '缺少登录过期时间配置',
        });
      }

      // 检查 token 是否过期
      const issuedAt = new Date(decodedToken.timestamp);
      const expirationTime = new Date(
        issuedAt.getTime() + loginExpired * 60 * 1000,
      );
      if (new Date() > expirationTime) {
        throw new UnauthorizedException({
          code: 401,
          message: '登录token已过期',
        });
      }

      return true;
    } catch (error) {
      logger.error(error);
      throw new UnauthorizedException({
        code: 401,
        message: 'token验证服务错误',
      });
    }
  }
}
