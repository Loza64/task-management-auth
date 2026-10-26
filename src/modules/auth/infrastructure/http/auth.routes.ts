import { Router } from 'express';
import { validateDTO } from '../../../../shared/middlewares/validate-dto.middleware';
import { LoginDto } from '../../application/login.dto';
import { RegisterDto } from '../../application/register.dto';
import { AuthController } from './auth.controller';

export const buildAuthRouter = (controller: AuthController): Router => {
  const router = Router();

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Registra un usuario
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterDto'
   *     responses:
   *       201:
   *         description: Usuario creado
   *       400:
   *         description: Error de validación
   *       409:
   *         description: El username ya está en uso
   */
  router.post('/register', validateDTO(RegisterDto), controller.register);

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Inicia sesión y devuelve un token JWT
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginDto'
   *     responses:
   *       200:
   *         description: Token de acceso y datos del usuario
   *       400:
   *         description: Error de validación
   *       401:
   *         description: Credenciales inválidas
   */
  router.post('/login', validateDTO(LoginDto), controller.login);

  return router;
};
