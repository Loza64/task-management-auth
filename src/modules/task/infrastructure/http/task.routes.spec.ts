import request from 'supertest';
import { createApp } from '../../../../app';
import { JwtTokenService } from '../../../auth/infrastructure/security/jwt-token.service';

const VALID_ID = '507f1f77bcf86cd799439011';
const USER_ID = '507f1f77bcf86cd799439022';

describe('task routes (auth and validation layers)', () => {
  const app = createApp();
  const token = new JwtTokenService(process.env.JWT_SECRET as string, 3600).issue(USER_ID).token;
  const auth = { Authorization: `Bearer ${token}` };

  it('GET /api-docs.json serves the OpenAPI spec with bearer auth', async () => {
    const res = await request(app).get('/api-docs.json');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body.openapi).toBe('3.0.0');
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining(['/api/tasks', '/api/auth/login', '/api/auth/signup', '/api/users/{id}']),
    );
    expect(res.body.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
  });

  describe('access control', () => {
    it.each([
      ['get', '/api/tasks'],
      ['post', '/api/tasks'],
      ['get', `/api/tasks/${VALID_ID}`],
      ['patch', `/api/tasks/${VALID_ID}`],
      ['patch', `/api/tasks/${VALID_ID}/status`],
      ['patch', `/api/tasks/${VALID_ID}/complete`],
      ['delete', `/api/tasks/${VALID_ID}`],
    ] as const)('%s %s requires a token', async (method, url) => {
      const res = await request(app)[method](url).send({});

      expect(res.status).toBe(401);
    });

    it('rejects a malformed or invalid token', async () => {
      const wrongScheme = await request(app).get('/api/tasks').set('Authorization', `Basic ${token}`);
      const garbage = await request(app).get('/api/tasks').set('Authorization', 'Bearer not-a-token');

      expect(wrongScheme.status).toBe(401);
      expect(garbage.status).toBe(401);
    });
  });

  describe('validation (with a valid token)', () => {
    it('POST /api/tasks rejects a body without title', async () => {
      const res = await request(app).post('/api/tasks').set(auth).send({ description: 'sin título' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('title');
    });

    it('POST /api/tasks rejects a client-supplied status or user', async () => {
      const status = await request(app).post('/api/tasks').set(auth).send({ title: 'Válida', status: 'completed' });
      const user = await request(app).post('/api/tasks').set(auth).send({ title: 'Válida', user: VALID_ID });

      expect(status.status).toBe(400);
      expect(status.body.message).toContain('status');
      expect(user.status).toBe(400);
      expect(user.body.message).toContain('user');
    });

    it('GET /api/tasks rejects an unknown status filter and a huge pageSize', async () => {
      const status = await request(app).get('/api/tasks?status=borrada').set(auth);
      const size = await request(app).get('/api/tasks?pageSize=1000').set(auth);

      expect(status.status).toBe(400);
      expect(status.body.message).toContain('status');
      expect(size.status).toBe(400);
    });

    it.each([
      ['get', '/api/tasks/abc'],
      ['patch', '/api/tasks/123'],
      ['patch', '/api/tasks/abc/complete'],
      ['patch', '/api/tasks/abc/status'],
      ['delete', '/api/tasks/abc'],
    ] as const)('%s %s rejects an invalid ObjectId', async (method, url) => {
      const res = await request(app)[method](url).set(auth).send({ status: 'completed' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('ObjectId');
    });

    it('PATCH /api/tasks/:id/status rejects an invalid status', async () => {
      const res = await request(app).patch(`/api/tasks/${VALID_ID}/status`).set(auth).send({ status: 'done' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('status');
    });

    it('PATCH /api/tasks/:id rejects changing the status through the generic update', async () => {
      const res = await request(app).patch(`/api/tasks/${VALID_ID}`).set(auth).send({ status: 'completed' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('status');
    });
  });
});
