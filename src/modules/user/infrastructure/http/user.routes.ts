import { Router } from 'express';
import { validateObjectIdParam } from '../../../../shared/middlewares/validate-object-id-param.middleware';
import { validateQuery } from '../../../../shared/middlewares/validate-query.middleware';
import { UserQueryDto } from '../../application/user-query.dto';
import { UserController } from './user.controller';

export const buildUserRouter = (controller: UserController): Router => {
  const router = Router();

  router.param('id', validateObjectIdParam);

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Lista usuarios (paginado, sin tareas)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: pageSize
   *         schema: { type: integer, default: 10 }
   *       - in: query
   *         name: search
   *         description: Busca en name y username
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Listado paginado de usuarios
   *       400:
   *         description: Parámetros de consulta inválidos
   *       401:
   *         description: Token ausente, inválido o expirado
   */
  router.get('/', validateQuery(UserQueryDto), controller.findAll);

  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: Obtiene un usuario con su arreglo de tareas
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, description: ObjectId del usuario }
   *     responses:
   *       200:
   *         description: Usuario con sus tareas
   *       400:
   *         description: Id inválido
   *       401:
   *         description: Token ausente, inválido o expirado
   *       404:
   *         description: Usuario no encontrado
   */
  router.get('/:id', controller.findOne);

  return router;
};
