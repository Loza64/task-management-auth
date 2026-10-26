import { AppError } from '../../../shared/errors/AppError';
import { Task } from '../domain/task.entity';
import { TaskRepository } from '../domain/task.repository';
import { UpdateTaskDto } from './update-task.dto';

export class UpdateTaskUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(id: string, userId: string, input: UpdateTaskDto): Promise<Task> {
    if (input.title === undefined && input.description === undefined) {
      throw new AppError('Debes enviar al menos un campo para actualizar (title o description)', 400);
    }

    const task = await this.taskRepository.findById(id, userId);
    if (!task) {
      throw new AppError('Tarea no encontrada', 404);
    }

    if (input.title !== undefined) task.title = input.title;
    if (input.description !== undefined) task.description = input.description || null;

    return this.taskRepository.save(task);
  }
}
