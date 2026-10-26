import { NextFunction, Request, Response } from 'express';
import { buildPaginatedResponse } from '../../../../shared/pagination/paginate.util';
import { getAuthUserId } from '../../../auth/infrastructure/http/authenticate.middleware';
import { ChangeTaskStatusUseCase } from '../../application/change-task-status.use-case';
import { CompleteTaskUseCase } from '../../application/complete-task.use-case';
import { CreateTaskUseCase } from '../../application/create-task.use-case';
import { DeleteTaskUseCase } from '../../application/delete-task.use-case';
import { FindAllTasksUseCase } from '../../application/find-all-tasks.use-case';
import { FindTaskByIdUseCase } from '../../application/find-task-by-id.use-case';
import { TaskQueryDto } from '../../application/task-query.dto';
import { UpdateTaskUseCase } from '../../application/update-task.use-case';

export class TaskController {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly updateTaskUseCase: UpdateTaskUseCase,
    private readonly changeTaskStatusUseCase: ChangeTaskStatusUseCase,
    private readonly completeTaskUseCase: CompleteTaskUseCase,
    private readonly deleteTaskUseCase: DeleteTaskUseCase,
    private readonly findAllTasksUseCase: FindAllTasksUseCase,
    private readonly findTaskByIdUseCase: FindTaskByIdUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await this.createTaskUseCase.execute(getAuthUserId(req), req.body);
      res.status(201).json({ data: task.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, pageSize, search, status } = req.validatedQuery as TaskQueryDto;
      const result = await this.findAllTasksUseCase.execute({ userId: getAuthUserId(req), page, pageSize, search, status });
      res.status(200).json(buildPaginatedResponse(result, (task) => task.toPublic()));
    } catch (err) {
      next(err);
    }
  };

  findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await this.findTaskByIdUseCase.execute(String(req.params.id), getAuthUserId(req));
      res.status(200).json({ data: task.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await this.updateTaskUseCase.execute(String(req.params.id), getAuthUserId(req), req.body);
      res.status(200).json({ data: task.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  changeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await this.changeTaskStatusUseCase.execute(String(req.params.id), getAuthUserId(req), req.body.status);
      res.status(200).json({ data: task.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await this.completeTaskUseCase.execute(String(req.params.id), getAuthUserId(req));
      res.status(200).json({ data: task.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.deleteTaskUseCase.execute(String(req.params.id), getAuthUserId(req));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
