import { User } from '../../user/domain/user.entity';
import { UserRepository } from '../../user/domain/user.repository';
import { PasswordHasher } from '../domain/password-hasher';
import { TokenService } from '../domain/token-service';
import { LoginUseCase } from './login.use-case';
import { SignupUseCase } from './signup.use-case';

const makeUser = () =>
  Object.assign(new User(), { id: 'u1', name: 'Ana', username: 'ana', password: 'stored-hash' });

describe('auth use cases', () => {
  const userRepository = {
    findById: jest.fn(),
    findAll: jest.fn(),
    findByUsername: jest.fn(),
    create: jest.fn(),
    addTask: jest.fn(),
    removeTask: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;

  const passwordHasher = { hash: jest.fn(), compare: jest.fn() } as unknown as jest.Mocked<PasswordHasher>;
  const tokenService = { issue: jest.fn(), verify: jest.fn() } as unknown as jest.Mocked<TokenService>;

  beforeEach(() => {
    jest.resetAllMocks();
    passwordHasher.hash.mockResolvedValue('hashed');
    userRepository.create.mockImplementation(async (user) => user);
  });

  describe('SignupUseCase', () => {
    const useCase = new SignupUseCase(userRepository, passwordHasher);

    it('409 when the username is already taken', async () => {
      userRepository.findByUsername.mockResolvedValue(makeUser());

      await expect(useCase.execute({ name: 'Ana', username: 'ana', password: 'secret123' })).rejects.toMatchObject({
        statusCode: 409,
      });
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('stores only the password hash', async () => {
      userRepository.findByUsername.mockResolvedValue(null);

      const user = await useCase.execute({ name: 'Ana', username: 'ana', password: 'secret123' });

      expect(passwordHasher.hash).toHaveBeenCalledWith('secret123');
      expect(user.password).toBe('hashed');
      expect(user.toPublic()).not.toHaveProperty('password');
    });
  });

  describe('LoginUseCase', () => {
    const useCase = new LoginUseCase(userRepository, passwordHasher, tokenService);

    it('returns a token when the credentials are valid', async () => {
      userRepository.findByUsername.mockResolvedValue(makeUser());
      passwordHasher.compare.mockResolvedValue(true);
      tokenService.issue.mockReturnValue({ token: 'jwt', expiresIn: 3600 });

      const result = await useCase.execute({ username: 'ana', password: 'secret123' });

      expect(passwordHasher.compare).toHaveBeenCalledWith('secret123', 'stored-hash');
      expect(tokenService.issue).toHaveBeenCalledWith('u1');
      expect(result).toMatchObject({ accessToken: 'jwt', expiresIn: 3600 });
    });

    it('401 with the same message when the password is wrong', async () => {
      userRepository.findByUsername.mockResolvedValue(makeUser());
      passwordHasher.compare.mockResolvedValue(false);

      await expect(useCase.execute({ username: 'ana', password: 'bad' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Credenciales inválidas',
      });
      expect(tokenService.issue).not.toHaveBeenCalled();
    });

    it('401 with the same message when the username does not exist, still comparing a hash', async () => {
      userRepository.findByUsername.mockResolvedValue(null);
      passwordHasher.compare.mockResolvedValue(false);

      await expect(useCase.execute({ username: 'nadie', password: 'secret123' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Credenciales inválidas',
      });
      expect(passwordHasher.compare).toHaveBeenCalledTimes(1);
    });
  });
});
