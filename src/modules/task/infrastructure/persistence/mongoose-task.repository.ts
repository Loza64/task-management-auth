import { AppError } from '../../../../shared/errors/AppError';
import { containsRegex } from '../../../../shared/pagination/regex-search.util';
import { Page } from '../../../../shared/pagination/pagination.types';
import { toTaskDomain } from '../../../user/infrastructure/persistence/user.mapper';
import { UserModel } from '../../../user/infrastructure/persistence/user.schema';
import { Task } from '../../domain/task.entity';
import { TaskListParams, TaskRepository } from '../../domain/task.repository';
import { TaskModel } from './task.schema';

const USER_POPULATE = { path: 'user', model: UserModel, select: 'name username createdAt updatedAt' };

export class MongooseTaskRepository implements TaskRepository {
  async findAll({ userId, page, pageSize, search, status }: TaskListParams): Promise<Page<Task>> {
    const filter: Record<string, unknown> = { user: userId };
    if (status) filter.status = status;
    if (search) {
      const pattern = containsRegex(search);
      filter.$or = [{ title: pattern }, { description: pattern }];
    }

    const result = await TaskModel.paginate(filter, {
      page,
      limit: pageSize,
      sort: { createdAt: -1, _id: -1 },
      populate: USER_POPULATE,
      lean: true,
    });

    return {
      items: result.docs.map(toTaskDomain),
      meta: {
        page: result.page ?? page,
        pageSize: result.limit,
        pageCount: result.totalPages,
        total: result.totalDocs,
      },
    };
  }

  async findById(id: string, userId: string): Promise<Task | null> {
    const doc = await TaskModel.findOne({ _id: id, user: userId }).populate(USER_POPULATE).lean();
    return doc ? toTaskDomain(doc) : null;
  }

  async save(task: Task): Promise<Task> {
    const fields = {
      title: task.title,
      description: task.description,
      status: task.status,
      completedAt: task.completedAt,
    };

    if (!task.id) {
      const created = await TaskModel.create({ ...fields, user: task.userId });
      await created.populate(USER_POPULATE);
      return toTaskDomain(created.toObject());
    }

    const updated = await TaskModel.findOneAndUpdate(
      { _id: task.id, user: task.userId },
      { $set: fields },
      { new: true, runValidators: true },
    )
      .populate(USER_POPULATE)
      .lean();

    if (!updated) {
      throw new AppError('Tarea no encontrada', 404);
    }
    return toTaskDomain(updated);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const { deletedCount } = await TaskModel.deleteOne({ _id: id, user: userId });
    return deletedCount === 1;
  }
}
