import { Types } from 'mongoose';
import { Task } from '../../../task/domain/task.entity';
import type { PopulatedUserDocument, TaskDocument } from '../../../task/infrastructure/persistence/task.schema';
import { User } from '../../domain/user.entity';
import type { UserDocument } from './user.schema';

type UserSource = PopulatedUserDocument & {
  password?: string;
  tasks?: UserDocument['tasks'];
};

export const toTaskDomain = (doc: TaskDocument): Task => {
  const task = Object.assign(new Task(), {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description ?? null,
    status: doc.status,
    completedAt: doc.completedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });

  if (doc.user instanceof Types.ObjectId) {
    task.userId = doc.user.toString();
  } else {
    task.userId = doc.user._id.toString();
    task.user = toUserDomain(doc.user);
  }

  return task;
};

export const toUserDomain = (doc: UserSource, withTasks = false): User => {
  const user = Object.assign(new User(), {
    id: doc._id.toString(),
    name: doc.name,
    username: doc.username,
    password: doc.password ?? '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });

  if (withTasks) {
    user.tasks = (doc.tasks ?? [])
      .filter((task): task is TaskDocument => !(task instanceof Types.ObjectId))
      .map(toTaskDomain);
  }

  return user;
};
