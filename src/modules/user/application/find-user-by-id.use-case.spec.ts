import { User } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';
import { FindUserByIdUseCase } from './find-user-by-id.use-case';

const ID = '507f1f77bcf86cd799439011';
const OTHER_ID = '507f1f77bcf86cd799439022';

describe('FindUserByIdUseCase', () => {
  const userRepository = { findById: jest.fn() } as unknown as jest.Mocked<UserRepository>;
  const useCase = new FindUserByIdUseCase(userRepository);

  beforeEach(() => jest.resetAllMocks());

  it('403 when asking for another user, without querying the database', async () => {
    await expect(useCase.execute(OTHER_ID, ID)).rejects.toMatchObject({ statusCode: 403 });
    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it('404 when the user no longer exists', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(ID, ID)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns the user loading its tasks', async () => {
    const user = Object.assign(new User(), { id: ID });
    userRepository.findById.mockResolvedValue(user);

    await expect(useCase.execute(ID.toUpperCase(), ID)).resolves.toBe(user);
    expect(userRepository.findById).toHaveBeenCalledWith(ID.toUpperCase(), true);
  });
});
