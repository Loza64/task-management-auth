import { UserRepository } from '../domain/user.repository';
import { FindAllUsersUseCase } from './find-all-users.use-case';

describe('FindAllUsersUseCase', () => {
  it('delegates the pagination params to the repository', async () => {
    const page = { items: [], meta: { page: 2, pageSize: 5, pageCount: 1, total: 0 } };
    const userRepository = { findAll: jest.fn().mockResolvedValue(page) } as unknown as jest.Mocked<UserRepository>;

    const result = await new FindAllUsersUseCase(userRepository).execute({ page: 2, pageSize: 5, search: 'ana' });

    expect(userRepository.findAll).toHaveBeenCalledWith({ page: 2, pageSize: 5, search: 'ana' });
    expect(result).toBe(page);
  });
});
