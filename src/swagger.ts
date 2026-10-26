import swaggerJsdoc from 'swagger-jsdoc';
import { buildSwaggerDefinitions } from './shared/swagger/schemas';

const isProd = process.env.NODE_ENV === 'production';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      version: 'v1.0.0',
      title: 'Task Management API',
      description: 'API REST de tareas con autenticación JWT. Cada usuario gestiona solo sus propias tareas.',
    },
    servers: [{ url: '/' }],
    components: {
      schemas: buildSwaggerDefinitions(),
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: [
    isProd
      ? './build/modules/**/infrastructure/http/*.routes.js'
      : './src/modules/**/infrastructure/http/*.routes.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
