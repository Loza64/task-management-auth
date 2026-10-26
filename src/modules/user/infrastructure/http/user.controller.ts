import { NextFunction, Request, Response } from 'express';
import { getAuthUserId } from '../../../auth/infrastructure/http/authenticate.middleware';
import { buildPaginatedResponse } from '../../../../shared/pagination/paginate.util';
import { FindAllUsersUseCase } from '../../application/find-all-users.use-case';
import { UserQueryDto } from '../../application/user-query.dto';
import { FindUserByIdUseCase } from '../../application/find-user-by-id.use-case';

export class UserController {
  constructor(
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
  ) {}

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, pageSize, search } = req.validatedQuery as UserQueryDto;
      const result = await this.findAllUsersUseCase.execute({ page, pageSize, search });
      res.status(200).json(buildPaginatedResponse(result, (user) => user.toPublic()));
    } catch (err) {
      next(err);
    }
  };

  findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.findUserByIdUseCase.execute(String(req.params.id), getAuthUserId(req));
      res.status(200).json({ data: user.toPublic() });
    } catch (err) {
      next(err);
    }
  };
}
