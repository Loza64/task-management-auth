import { AppError } from '../../../shared/errors/AppError';
import { UserRepository } from '../../user/domain/user.repository';
import { TaskRepository } from '../domain/task.repository';

export class DeleteTaskUseCase {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const deleted = await this.taskRepository.delete(id, userId);
    if (!deleted) {
      throw new AppError('Tarea no encontrada', 404);
    }

    await this.userRepository.removeTask(userId, id);
  }
}
