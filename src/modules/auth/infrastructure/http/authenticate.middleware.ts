import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppError } from '../../../../shared/errors/AppError';
import { TokenService } from '../../domain/token-service';

export const buildAuthenticate =
  (tokenService: TokenService): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      next(new AppError('Token de acceso requerido', 401));
      return;
    }

    try {
      req.auth = { userId: tokenService.verify(token) };
      next();
    } catch (err) {
      next(err);
    }
  };

export const getAuthUserId = (req: Request): string => {
  if (!req.auth) {
    throw new AppError('No autenticado', 401);
  }
  return req.auth.userId;
};
