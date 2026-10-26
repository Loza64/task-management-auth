import { Task, TaskStatus } from '../domain/task.entity';
import { ChangeTaskStatusUseCase } from './change-task-status.use-case';

export class CompleteTaskUseCase {
  constructor(private readonly changeTaskStatusUseCase: ChangeTaskStatusUseCase) {}

  execute(id: string, userId: string): Promise<Task> {
    return this.changeTaskStatusUseCase.execute(id, userId, TaskStatus.COMPLETED);
  }
}
