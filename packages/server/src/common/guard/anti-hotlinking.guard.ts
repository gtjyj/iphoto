import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { SiteConfig } from 'src/logic/site-config';
import logger from 'src/utils/logger';

export class CorsErrorException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.FORBIDDEN);
  }
}

@Injectable()
export class AntiHotlinkingGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const referer = request.headers.referer;
    if (!referer) {
      return false;
    }
    const refererUrl = new URL(referer);
    const cfgUrl = String(SiteConfig.getInstance().getValue('domain'));
    let isAllowed = false;
    try {
      const domain = new URL(cfgUrl);
      isAllowed = domain.host.includes(refererUrl.host);
    } catch (e) {
      logger.error(e);
      logger.warn(
        '站点域名配置有误或未配置，盗链拦截无法正常工作, 任何域名均可访问',
      );
      return true;
    }
    if (!isAllowed) {
      throw new CorsErrorException('Cross-origin requests are not allowed');
    }

    return true;
  }
}
