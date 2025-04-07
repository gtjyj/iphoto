import { resolve } from 'path';
import * as dotenv from 'dotenv';
dotenv.config();
process.env.ROOT_DIR = resolve(__dirname, '../');
import { existsSync } from 'fs';
import * as express from 'express';

import * as rateLimit from 'express-rate-limit';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  configPath,
  getSystemConfigs,
  setSystemConfigs,
} from './init/check.config';
import { SystemConfig } from './types/system.config';
import { randomBytes } from 'crypto';
import {
  checkSubmitConfig,
  getSystemConfigTemplate,
} from './init/system.config.utils';
import { updateStaticResource, webResourceAccess } from './logic/web.resource';
import logger from './utils/logger';
import { webcrypto as crypto } from 'crypto';
//@ts-ignore
global.crypto = crypto;
async function bootstrap() {
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('./app.module');
  const { SiteConfig } = await import('./logic/site-config');
  const { routeForwardingMiddleware } = await import(
    './common/middlewares/route-forwarding.middleware'
  );
  const { GlobalExceptionFilter } = await import(
    './common/filters/global-exception.filter'
  );
  await SiteConfig.getInstance().isReady();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(routeForwardingMiddleware());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.setGlobalPrefix(process.env.API_PREFIX);
  app.set('trust proxy', 1);
  const systemConfig = getSystemConfigs();
  app.use(
    // @ts-ignore
    rateLimit({
      windowMs: Number(systemConfig.REQUEST_LIMIT_INTERVAL || 1) * 60 * 1000,
      max: Number(systemConfig.REQUEST_LIMIT || 200),
    }),
  );

  // 写入变量到html
  await updateStaticResource();

  await app.listen(process.env.PORT, '0.0.0.0', async () => {
    logger.info(
      '应用启动完成',
      process.env.PORT,
      process.env.NODE_ENV,
      process.env.ROOT_DIR,
    );
  });
}

let exporessInstance;

async function startExpressServer() {
  const expressApp = express();
  // 添加解析 JSON 数据的中间件
  expressApp.use(express.json());

  expressApp.get('/api/getConfigTemplate', async (req, res) => {
    res.json(await getSystemConfigTemplate());
  });
  expressApp.post('/api/getConfig', async (req, res) => {
    res.status(200).send({ code: 0, msg: '', data: {} });
  });
  expressApp.post('/api/submitConfig', async (req, res) => {
    const body: SystemConfig = req.body;
    const result = await checkSubmitConfig(body);
    if (result) {
      res.status(200).send({ code: 1000, msg: result });
      return;
    } else {
      setSystemConfigs({
        ...body,
        ENCRYPTION_KEY: randomBytes(32).toString('hex'),
        ENCRYPTION_IV: randomBytes(16).toString('hex'),
      });
      exporessInstance.close(() => {
        logger.info('express has been stopped');
        bootstrap();
      });
      res.status(200).send({ code: 0, msg: 'ok' });
    }
  });
  expressApp.get('/', (req, res) => {
    res.redirect('/systemconfig');
  });
  expressApp.get('*', (req, res) => {
    webResourceAccess(req, res);
  });

  exporessInstance = expressApp.listen(
    Number(process.env.PORT),
    '0.0.0.0',
    () => {
      logger.info(
        '系统初始化模式',
        process.env.PORT,
        process.env.NODE_ENV,
        process.env.ROOT_DIR,
      );
    },
  );
}
if (existsSync(configPath)) {
  bootstrap();
} else {
  startExpressServer();
}
