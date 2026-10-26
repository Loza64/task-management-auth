import { Router } from 'express';
import { validateDTO } from '../../../../shared/middlewares/validate-dto.middleware';
import { validateObjectIdParam } from '../../../../shared/middlewares/validate-object-id-param.middleware';
import { validateQuery } from '../../../../shared/middlewares/validate-query.middleware';
import { ChangeTaskStatusDto } from '../../application/change-task-status.dto';
import { CreateTaskDto } from '../../application/create-task.dto';
import { TaskQueryDto } from '../../application/task-query.dto';
import { UpdateTaskDto } from '../../application/update-task.dto';
import { TaskController } from './task.controller';

export const buildTaskRouter = (controller: TaskController): Router => {
  const router = Router();

  router.param('id', validateObjectIdParam);

  /**
   * @swagger
   * /api/tasks:
   *   get:
   *     summary: Lista las tareas del usuario autenticado (paginado)
   *     tags: [Tasks]
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
   *         description: Busca en título y descripción
   *         schema: { type: string }
   *       - in: query
   *         name: status
   *         description: Filtra por estado
   *         schema: { type: string, enum: [pending, in_progress, completed] }
   *     responses:
   *       401:
   *         description: Token ausente, inválido o expirado
   *       200:
   *         description: Listado paginado de tareas
   *       400:
   *         description: Parámetros de consulta inválidos
   */
  router.get('/', validateQuery(TaskQueryDto), controller.findAll);

  /**
   * @swagger
   * /api/tasks/{id}:
   *   get:
   *     summary: Busca una tarea por id
   *     tags: [Tasks]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, description: ObjectId de MongoDB }
   *     responses:
   *       401:
   *         description: Token ausente, inválido o expirado
   *       200:
   *         description: Tarea encontrada
   *       400:
   *         description: Id inválido
   *       404:
   *         description: Tarea no encontrada
   */
  router.get('/:id', controller.findOne);

  /**
   * @swagger
   * /api/tasks:
   *   post:
   *     summary: Crea una tarea (estado inicial pending)
   *     tags: [Tasks]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateTaskDto'
   *     responses:
   *       401:
   *         description: Token ausente, inválido o expirado
   *       201:
   *         description: Tarea creada
   *       400:
   *         description: Error de validación
   */
  router.post('/', validateDTO(CreateTaskDto), controller.create);

  /**
   * @swagger
   * /api/tasks/{id}:
   *   patch:
   *     summary: Actualiza título y/o descripción (el estado se cambia en /status o /complete)
   *     tags: [Tasks]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateTaskDto'
   *     responses:
   *       401:
   *         description: Token ausente, inválido o expirado
   *       200:
   *         description: Tarea actualizada
   *       400:
   *         description: Error de validación
   *       404:
   *         description: Tarea no encontrada
   */
  router.patch('/:id', validateDTO(UpdateTaskDto), controller.update);

  /**
   * @swagger
   * /api/tasks/{id}/status:
   *   patch:
   *     summary: Cambia el estado (pending, in_progress, completed)
   *     tags: [Tasks]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ChangeTaskStatusDto'
   *     responses:
   *       401:
   *         description: Token ausente, inválido o expirado
   *       200:
   *         description: Estado actualizado
   *       400:
   *         description: Estado inválido
   *       404:
   *         description: Tarea no encontrada
   *       409:
   *         description: La tarea ya está en ese estado
   */
  router.patch('/:id/status', validateDTO(ChangeTaskStatusDto), controller.changeStatus);

  /**
   * @swagger
   * /api/tasks/{id}/complete:
   *   patch:
   *     summary: Marca la tarea como completada
   *     tags: [Tasks]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       401:
   *         description: Token ausente, inválido o expirado
   *       200:
   *         description: Tarea completada
   *       404:
   *         description: Tarea no encontrada
   *       409:
   *         description: La tarea ya estaba completada
   */
  router.patch('/:id/complete', controller.complete);

  /**
   * @swagger
   * /api/tasks/{id}:
   *   delete:
   *     summary: Elimina una tarea de forma permanente
   *     tags: [Tasks]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       401:
   *         description: Token ausente, inválido o expirado
   *       204:
   *         description: Tarea eliminada
   *       404:
   *         description: Tarea no encontrada
   */
  router.delete('/:id', controller.remove);

  return router;
};
