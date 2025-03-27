import { NextFunction, Request, Response } from 'express';
import { webResourceAccess } from 'src/logic/web.resource';

export function routeForwardingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/api')) {
      webResourceAccess(req, res);
    } else {
      next();
    }
  };
}
