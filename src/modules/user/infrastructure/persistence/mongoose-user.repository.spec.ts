import { Types } from 'mongoose';
import { MongooseUserRepository } from './mongoose-user.repository';
import { UserModel } from './user.schema';

describe('MongooseUserRepository.findAll', () => {
  afterEach(() => jest.restoreAllMocks());

  it('searches by name or username and maps users without password or tasks', async () => {
    const now = new Date();
    const paginate = jest.spyOn(UserModel, 'paginate').mockResolvedValue({
      docs: [{ _id: new Types.ObjectId(), name: 'Ana', username: 'ana', tasks: [new Types.ObjectId()], createdAt: now, updatedAt: now }],
      totalDocs: 11,
      limit: 5,
      page: 3,
      totalPages: 3,
    } as never);

    const page = await new MongooseUserRepository().findAll({ page: 3, pageSize: 5, search: 'an.a' });

    expect(paginate).toHaveBeenCalledWith(
      { $or: [{ name: /an\.a/i }, { username: /an\.a/i }] },
      expect.objectContaining({ page: 3, limit: 5, lean: true }),
    );
    expect(page.meta).toEqual({ page: 3, pageSize: 5, pageCount: 3, total: 11 });
    const [user] = page.items.map((item) => item.toPublic());
    expect(user).toMatchObject({ name: 'Ana', username: 'ana' });
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('tasks');
  });
});
