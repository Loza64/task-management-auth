import { AppError } from '../../../shared/errors/AppError';
import { Task } from '../domain/task.entity';
import { TaskRepository } from '../domain/task.repository';

export class FindTaskByIdUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(id: string, userId: string): Promise<Task> {
    const task = await this.taskRepository.findById(id, userId);
    if (!task) {
      throw new AppError('Tarea no encontrada', 404);
    }
    return task;
  }
}
