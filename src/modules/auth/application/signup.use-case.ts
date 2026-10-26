import { AppError } from '../../../shared/errors/AppError';
import { User } from '../../user/domain/user.entity';
import { UserRepository } from '../../user/domain/user.repository';
import { PasswordHasher } from '../domain/password-hasher';
import { SignupDto } from './signup.dto';

export class SignupUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: SignupDto): Promise<User> {
    const existing = await this.userRepository.findByUsername(input.username);
    if (existing) {
      throw new AppError('El username ya está en uso', 409);
    }

    const user = new User();
    user.name = input.name;
    user.username = input.username;
    user.password = await this.passwordHasher.hash(input.password);

    return this.userRepository.create(user);
  }
}
