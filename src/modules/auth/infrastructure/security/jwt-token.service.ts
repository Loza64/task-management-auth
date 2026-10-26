import jwt from 'jsonwebtoken';
import { AppError } from '../../../../shared/errors/AppError';
import { IssuedToken, TokenService } from '../../domain/token-service';

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds: number,
  ) {}

  issue(userId: string): IssuedToken {
    const token = jwt.sign({}, this.secret, {
      subject: userId,
      algorithm: 'HS256',
      expiresIn: this.expiresInSeconds,
    });

    return { token, expiresIn: this.expiresInSeconds };
  }

  verify(token: string): string {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || !payload.sub) {
        throw new AppError('Token inválido', 401);
      }
      return payload.sub;
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (err instanceof jwt.TokenExpiredError) throw new AppError('El token ha expirado', 401);
      throw new AppError('Token inválido', 401);
    }
  }
}
