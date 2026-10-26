import { compare, hash } from 'bcryptjs';
import { PasswordHasher } from '../../domain/password-hasher';

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly saltRounds: number) {}

  hash(plain: string): Promise<string> {
    return hash(plain, this.saltRounds);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
