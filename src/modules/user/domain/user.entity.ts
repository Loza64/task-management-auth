import type { PublicTask, Task } from '../../task/domain/task.entity';

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  tasks?: PublicTask[];
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  id: string = '';
  name: string = '';
  username: string = '';
  password: string = '';
  tasks?: Task[];
  createdAt: Date = new Date();
  updatedAt: Date = new Date();

  toPublic(): PublicUser {
    return {
      id: this.id,
      name: this.name,
      username: this.username,
      ...(this.tasks ? { tasks: this.tasks.map((task) => task.toPublic()) } : {}),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
