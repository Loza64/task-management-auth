import { AppError } from '../../../shared/errors/AppError';
import { User } from '../../user/domain/user.entity';
import { UserRepository } from '../../user/domain/user.repository';
import { PasswordHasher } from '../domain/password-hasher';
import { TokenService } from '../domain/token-service';
import { LoginDto } from './login.dto';

export interface LoginResult {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export class LoginUseCase {
  private dummyHash?: Promise<string>;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginDto): Promise<LoginResult> {
    const user = await this.userRepository.findByUsername(input.username);

    const hash = user ? user.password : await this.getDummyHash();
    const passwordMatches = await this.passwordHasher.compare(input.password, hash);

    if (!user || !passwordMatches) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const { token, expiresIn } = this.tokenService.issue(user.id);

    return { user, accessToken: token, expiresIn };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.passwordHasher.hash('dummy-password-for-timing');
    return this.dummyHash;
  }
}
