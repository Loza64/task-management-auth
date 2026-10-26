import request from 'supertest';
import { createApp } from '../../../../app';
import { JwtTokenService } from '../security/jwt-token.service';

const USER_ID = '507f1f77bcf86cd799439022';
const OTHER_ID = '507f1f77bcf86cd799439033';

describe('auth and user routes (validation and access control)', () => {
  const app = createApp();
  const token = new JwtTokenService(process.env.JWT_SECRET as string, 3600).issue(USER_ID).token;
  const auth = { Authorization: `Bearer ${token}` };

  describe('POST /api/auth/register', () => {
    it.each([
      ['invalid username', { name: 'Ana', username: 'no spaces!', password: 'secret123' }, 'username'],
      ['short username', { name: 'Ana', username: 'ab', password: 'secret123' }, 'username'],
      ['weak password', { name: 'Ana', username: 'ana', password: 'short' }, 'password'],
      ['missing name', { username: 'ana', password: 'secret123' }, 'name'],
      ['unknown field', { name: 'Ana', username: 'ana', password: 'secret123', role: 'admin' }, 'role'],
    ])('400: %s', async (_label, body, field) => {
      const res = await request(app).post('/api/auth/register').send(body);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(field);
    });
  });

  describe('POST /api/auth/login', () => {
    it('400 without credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/users', () => {
    it('401 without a token', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).toBe(401);
    });

    it('400 with invalid pagination', async () => {
      const res = await request(app).get('/api/users?pageSize=1000').set(auth);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/users/:id', () => {
    it('401 without a token', async () => {
      const res = await request(app).get(`/api/users/${USER_ID}`);

      expect(res.status).toBe(401);
    });

    it('400 with an invalid id', async () => {
      const res = await request(app).get('/api/users/abc').set(auth);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('ObjectId');
    });

    it('403 when asking for another user', async () => {
      const res = await request(app).get(`/api/users/${OTHER_ID}`).set(auth);

      expect(res.status).toBe(403);
    });
  });
});
