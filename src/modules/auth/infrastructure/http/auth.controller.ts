import { NextFunction, Request, Response } from 'express';
import { LoginUseCase } from '../../application/login.use-case';
import { RegisterUseCase } from '../../application/register.use-case';

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.registerUseCase.execute(req.body);
      res.status(201).json({ data: user.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, accessToken, expiresIn } = await this.loginUseCase.execute(req.body);
      res.status(200).json({
        data: { accessToken, tokenType: 'Bearer', expiresIn, user: user.toPublic() },
      });
    } catch (err) {
      next(err);
    }
  };
}
