import { AppError } from '../../../shared/errors/AppError';
import { Task, TaskStatus } from '../domain/task.entity';
import { TaskRepository } from '../domain/task.repository';

export class ChangeTaskStatusUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(id: string, userId: string, status: TaskStatus): Promise<Task> {
    const task = await this.taskRepository.findById(id, userId);
    if (!task) {
      throw new AppError('Tarea no encontrada', 404);
    }

    task.changeStatus(status);

    return this.taskRepository.save(task);
  }
}
