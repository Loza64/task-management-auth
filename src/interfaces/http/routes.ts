import { Router } from 'express';
import { Container } from '../../composition-root';
import { buildAuthRouter } from '../../modules/auth/infrastructure/http/auth.routes';
import { buildTaskRouter } from '../../modules/task/infrastructure/http/task.routes';
import { buildUserRouter } from '../../modules/user/infrastructure/http/user.routes';

export const buildApiRouter = (container: Container): Router => {
  const router = Router();

  router.use('/auth', buildAuthRouter(container.authController));
  router.use('/users', container.authenticate, buildUserRouter(container.userController));
  router.use('/tasks', container.authenticate, buildTaskRouter(container.taskController));

  return router;
};
