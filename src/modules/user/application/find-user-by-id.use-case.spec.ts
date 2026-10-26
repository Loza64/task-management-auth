import { User } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';
import { FindUserByIdUseCase } from './find-user-by-id.use-case';

const ID = '507f1f77bcf86cd799439011';

describe('FindUserByIdUseCase', () => {
  const userRepository = { findById: jest.fn() } as unknown as jest.Mocked<UserRepository>;
  const useCase = new FindUserByIdUseCase(userRepository);

  beforeEach(() => jest.resetAllMocks());

  it('404 when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(ID)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns the user loading its tasks', async () => {
    const user = Object.assign(new User(), { id: ID });
    userRepository.findById.mockResolvedValue(user);

    await expect(useCase.execute(ID)).resolves.toBe(user);
    expect(userRepository.findById).toHaveBeenCalledWith(ID, true);
  });
});
