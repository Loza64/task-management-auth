import { LoginUseCase } from './modules/auth/application/login.use-case';
import { SignupUseCase } from './modules/auth/application/signup.use-case';
import { AuthController } from './modules/auth/infrastructure/http/auth.controller';
import { buildAuthenticate } from './modules/auth/infrastructure/http/authenticate.middleware';
import { BcryptPasswordHasher } from './modules/auth/infrastructure/security/bcrypt-password-hasher';
import { JwtTokenService } from './modules/auth/infrastructure/security/jwt-token.service';
import { ChangeTaskStatusUseCase } from './modules/task/application/change-task-status.use-case';
import { CompleteTaskUseCase } from './modules/task/application/complete-task.use-case';
import { CreateTaskUseCase } from './modules/task/application/create-task.use-case';
import { DeleteTaskUseCase } from './modules/task/application/delete-task.use-case';
import { FindAllTasksUseCase } from './modules/task/application/find-all-tasks.use-case';
import { FindTaskByIdUseCase } from './modules/task/application/find-task-by-id.use-case';
import { UpdateTaskUseCase } from './modules/task/application/update-task.use-case';
import { TaskController } from './modules/task/infrastructure/http/task.controller';
import { MongooseTaskRepository } from './modules/task/infrastructure/persistence/mongoose-task.repository';
import { FindAllUsersUseCase } from './modules/user/application/find-all-users.use-case';
import { FindUserByIdUseCase } from './modules/user/application/find-user-by-id.use-case';
import { UserController } from './modules/user/infrastructure/http/user.controller';
import { MongooseUserRepository } from './modules/user/infrastructure/persistence/mongoose-user.repository';
import { env } from './shared/config/env';

export const buildContainer = () => {
  const userRepository = new MongooseUserRepository();
  const taskRepository = new MongooseTaskRepository();

  const passwordHasher = new BcryptPasswordHasher(env.BCRYPT_SALT_ROUNDS);
  const tokenService = new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN_SECONDS);

  const authController = new AuthController(
    new SignupUseCase(userRepository, passwordHasher),
    new LoginUseCase(userRepository, passwordHasher, tokenService),
  );

  const userController = new UserController(
    new FindAllUsersUseCase(userRepository),
    new FindUserByIdUseCase(userRepository),
  );

  const changeTaskStatusUseCase = new ChangeTaskStatusUseCase(taskRepository);
  const taskController = new TaskController(
    new CreateTaskUseCase(taskRepository, userRepository),
    new UpdateTaskUseCase(taskRepository),
    changeTaskStatusUseCase,
    new CompleteTaskUseCase(changeTaskStatusUseCase),
    new DeleteTaskUseCase(taskRepository, userRepository),
    new FindAllTasksUseCase(taskRepository),
    new FindTaskByIdUseCase(taskRepository),
  );

  return {
    authenticate: buildAuthenticate(tokenService),
    authController,
    userController,
    taskController,
  };
};

export type Container = ReturnType<typeof buildContainer>;
