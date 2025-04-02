import { Request, Response } from 'express';
import * as httpProxy from 'http-proxy';
import { extname, join } from 'path';
import { existsSync, promises, readFile } from 'fs';
import * as dotenv from 'dotenv';
import logger from 'src/utils/logger';
dotenv.config();

const proxy = httpProxy.createProxyServer({});

let isWebStartedCache: boolean | null = null;
const target = process.env.WEB_PORT;

async function checkWebStatus() {
  const http = await import('http');
  return new Promise<boolean>((resolve) => {
    const req = http
      .get(target, (res) => {
        isWebStartedCache = true;
        resolve(true);
        res.resume(); // 消耗响应数据以释放内存
      })
      .on('error', () => {
        isWebStartedCache = false;
        resolve(false);
      });
    req.setTimeout(2000, () => {
      req.destroy();
      // 缓存结果
      isWebStartedCache = false;
      resolve(false);
    });
  });
}

setInterval(checkWebStatus, 5000);
checkWebStatus();

export async function webIsStart(): Promise<boolean> {
  // 检查缓存是否存在
  if (isWebStartedCache !== null) {
    return isWebStartedCache;
  }

  // 如果缓存不存在，等待第一次检测完成
  await checkWebStatus();
  return isWebStartedCache!;
}

export function webResourceAccess(req: Request, res: Response) {
  webIsStart().then((isTargetReachable) => {
    if (isTargetReachable) {
      logger.info('【开发模式】从web服务读取资源', req.path);
      proxy.web(req, res, { target }, (err) => {
        logger.error('Proxy error:', err);
        res.status(500).send('Proxy error');
      });
    } else {
      const webDist = join(process.env.ROOT_DIR + '/htmldist/');
      const webHtml = join(process.env.ROOT_DIR + '/html/');
      // logger.info(webDist, '读取资源');
      const filePath = join(
        existsSync(webDist) ? webDist : webHtml,
        req.path === '/' ? 'index.html' : req.path,
      );

      readFile(filePath, (err, data) => {
        if (err) {
          // 如果文件不存在，返回 index.html
          const indexPath = join(webDist, 'index.html');
          readFile(indexPath, (indexErr, indexData) => {
            if (indexErr) {
              logger.error('Error reading index.html:', indexErr);
              res.status(500).send('Error reading index.html');
            } else {
              res.setHeader('Content-Type', 'text/html');
              res.send(indexData);
            }
          });
        } else {
          // 根据文件扩展名设置 Content-Type
          const ext = extname(filePath);
          const contentType = getContentType(ext);
          res.setHeader('Content-Type', contentType);
          res.send(data);
        }
      });
    }
  });
}

// 根据文件扩展名返回 Content-Type
function getContentType(ext: string): string {
  switch (ext) {
    case '.html':
      return 'text/html';
    case '.js':
      return 'text/javascript';
    case '.css':
      return 'text/css';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

export async function updateStaticResource() {
  const webHtml = join(process.env.ROOT_DIR + '/html/');
  const webDist = join(process.env.ROOT_DIR + '/htmldist/');
  const { SiteConfig, siteConfigKeys } = await import('./site-config');
  // 确保目标目录存在
  await promises.mkdir(webDist, { recursive: true });

  // 获取配置
  const configs = SiteConfig.getInstance().getValue(siteConfigKeys);

  // 递归处理目录
  async function processDirectory(src: string, dest: string) {
    await promises.mkdir(dest, { recursive: true });
    const entries = await promises.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);

      if (entry.isDirectory()) {
        await processDirectory(srcPath, destPath);
      } else {
        const ext = extname(entry.name).toLowerCase();
        if (['.html', '.css', '.js'].includes(ext)) {
          // 读取并替换内容
          let content = await promises.readFile(srcPath, 'utf8');
          siteConfigKeys.forEach((key: string) => {
            const varName = `{__VAR_${key}__}`;
            const value = configs[key] || '';
            content = content.replace(new RegExp(varName, 'g'), value);
          });
          await promises.writeFile(destPath, content);
        } else {
          // 直接复制其他文件
          await promises.copyFile(srcPath, destPath);
        }
      }
    }
  }

  try {
    await processDirectory(webHtml, webDist);
    logger.info('静态资源更新完成');
  } catch (error) {
    logger.error('更新静态资源失败:', error);
    throw error;
  }
}
