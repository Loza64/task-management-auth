import { ListParams, Page } from '../../../shared/pagination/pagination.types';
import { User } from './user.entity';

export interface UserRepository {
  findAll(params: ListParams): Promise<Page<User>>;
  findById(id: string, withTasks: boolean): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(user: User): Promise<User>;
  addTask(userId: string, taskId: string): Promise<void>;
  removeTask(userId: string, taskId: string): Promise<void>;
}
