import { AppError } from '../../../shared/errors/AppError';
import { User } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';

export class FindUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string, requesterId: string): Promise<User> {
    if (id.toLowerCase() !== requesterId.toLowerCase()) {
      throw new AppError('No tienes permiso para ver este usuario', 403);
    }

    const user = await this.userRepository.findById(id, true);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }
    return user;
  }
}
