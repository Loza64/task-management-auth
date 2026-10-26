import { AppError } from '../../../shared/errors/AppError';
import type { PublicUser, User } from '../../user/domain/user.entity';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface PublicTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  completedAt: Date | null;
  user?: PublicUser;
  createdAt: Date;
  updatedAt: Date;
}

export class Task {
  id: string = '';
  title: string = '';
  description: string | null = null;
  status: TaskStatus = TaskStatus.PENDING;
  completedAt: Date | null = null;
  userId: string = '';
  user?: User;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();

  changeStatus(next: TaskStatus): void {
    if (next === this.status) {
      throw new AppError(`La tarea ya está en estado "${this.status}"`, 409);
    }

    this.status = next;
    this.completedAt = next === TaskStatus.COMPLETED ? new Date() : null;
  }

  toPublic(): PublicTask {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      completedAt: this.completedAt,
      ...(this.user ? { user: this.user.toPublic() } : {}),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
