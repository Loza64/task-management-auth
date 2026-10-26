import { Task } from '../domain/task.entity';
import { TaskRepository } from '../domain/task.repository';
import { UserRepository } from '../../user/domain/user.repository';
import { CreateTaskDto } from './create-task.dto';

export class CreateTaskUseCase {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string, input: CreateTaskDto): Promise<Task> {
    const task = new Task();
    task.title = input.title;
    task.description = input.description || null;
    task.userId = userId;

    const saved = await this.taskRepository.save(task);

    try {
      await this.userRepository.addTask(userId, saved.id);
    } catch (err) {
      await this.taskRepository.delete(saved.id, userId);
      throw err;
    }

    return saved;
  }
}
