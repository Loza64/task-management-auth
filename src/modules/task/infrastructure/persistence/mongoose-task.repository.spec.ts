import { Types } from 'mongoose';
import { TaskStatus } from '../../domain/task.entity';
import { MongooseTaskRepository } from './mongoose-task.repository';
import { TaskModel } from './task.schema';

describe('MongooseTaskRepository.findAll', () => {
  const repository = new MongooseTaskRepository();

  afterEach(() => jest.restoreAllMocks());

  it('scopes the query to the user, populates it and maps the page meta', async () => {
    const now = new Date();
    const userId = new Types.ObjectId();
    const paginate = jest.spyOn(TaskModel, 'paginate').mockResolvedValue({
      docs: [
        {
          _id: new Types.ObjectId(),
          title: 'Tarea',
          description: null,
          status: TaskStatus.PENDING,
          completedAt: null,
          user: { _id: userId, name: 'Ana', username: 'ana', createdAt: now, updatedAt: now },
          createdAt: now,
          updatedAt: now,
        },
      ],
      totalDocs: 21,
      limit: 10,
      page: 2,
      totalPages: 3,
    } as never);

    const page = await repository.findAll({
      userId: userId.toString(),
      page: 2,
      pageSize: 10,
      status: TaskStatus.PENDING,
      search: 'a.b',
    });

    expect(paginate).toHaveBeenCalledWith(
      { user: userId.toString(), status: TaskStatus.PENDING, $or: [{ title: /a\.b/i }, { description: /a\.b/i }] },
      expect.objectContaining({ page: 2, limit: 10, lean: true, populate: expect.objectContaining({ path: 'user' }) }),
    );
    expect(page.meta).toEqual({ page: 2, pageSize: 10, pageCount: 3, total: 21 });
    expect(page.items).toHaveLength(1);
    expect(page.items[0].toPublic().user).toMatchObject({ id: userId.toString(), name: 'Ana', username: 'ana' });
  });
});
