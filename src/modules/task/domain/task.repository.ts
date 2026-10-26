import { ListParams, Page } from '../../../shared/pagination/pagination.types';
import { Task, TaskStatus } from './task.entity';

export interface TaskListParams extends ListParams {
  userId: string;
  status?: TaskStatus;
}

export interface TaskRepository {
  findAll(params: TaskListParams): Promise<Page<Task>>;
  findById(id: string, userId: string): Promise<Task | null>;
  save(task: Task): Promise<Task>;
  delete(id: string, userId: string): Promise<boolean>;
}
