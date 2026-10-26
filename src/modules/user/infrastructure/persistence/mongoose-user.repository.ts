import { AppError } from '../../../../shared/errors/AppError';
import { isDuplicateKeyError } from '../../../../shared/database/mongo';
import { ListParams, Page } from '../../../../shared/pagination/pagination.types';
import { containsRegex } from '../../../../shared/pagination/regex-search.util';
import { TaskModel } from '../../../task/infrastructure/persistence/task.schema';
import { User } from '../../domain/user.entity';
import { UserRepository } from '../../domain/user.repository';
import { toUserDomain } from './user.mapper';
import { UserModel } from './user.schema';

export class MongooseUserRepository implements UserRepository {
  async findAll({ page, pageSize, search }: ListParams): Promise<Page<User>> {
    const filter: Record<string, unknown> = {};
    if (search) {
      const pattern = containsRegex(search);
      filter.$or = [{ name: pattern }, { username: pattern }];
    }

    const result = await UserModel.paginate(filter, {
      page,
      limit: pageSize,
      sort: { createdAt: -1, _id: -1 },
      lean: true,
    });

    return {
      items: result.docs.map((doc) => toUserDomain(doc)),
      meta: {
        page: result.page ?? page,
        pageSize: result.limit,
        pageCount: result.totalPages,
        total: result.totalDocs,
      },
    };
  }

  async findById(id: string, withTasks: boolean): Promise<User | null> {
    const query = UserModel.findById(id);
    if (withTasks) {
      query.populate({ path: 'tasks', model: TaskModel, options: { sort: { createdAt: -1, _id: -1 } } });
    }

    const doc = await query.lean();
    return doc ? toUserDomain(doc, withTasks) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const doc = await UserModel.findOne({ username }).select('+password').lean();
    return doc ? toUserDomain(doc) : null;
  }

  async create(user: User): Promise<User> {
    try {
      const created = await UserModel.create({ name: user.name, username: user.username, password: user.password });
      return toUserDomain(created.toObject());
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new AppError('El username ya está en uso', 409);
      }
      throw err;
    }
  }

  async addTask(userId: string, taskId: string): Promise<void> {
    await UserModel.updateOne({ _id: userId }, { $addToSet: { tasks: taskId } }, { timestamps: false });
  }

  async removeTask(userId: string, taskId: string): Promise<void> {
    await UserModel.updateOne({ _id: userId }, { $pull: { tasks: taskId } }, { timestamps: false });
  }
}
