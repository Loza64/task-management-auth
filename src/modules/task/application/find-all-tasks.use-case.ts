import { Page } from '../../../shared/pagination/pagination.types';
import { Task } from '../domain/task.entity';
import { TaskListParams, TaskRepository } from '../domain/task.repository';

export class FindAllTasksUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  execute(params: TaskListParams): Promise<Page<Task>> {
    return this.taskRepository.findAll(params);
  }
}
