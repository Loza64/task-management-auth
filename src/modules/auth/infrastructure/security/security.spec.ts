import jwt from 'jsonwebtoken';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';
import { JwtTokenService } from './jwt-token.service';

const SECRET = 'a-secret-that-is-long-enough-for-tests-1234';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher(4);

  it('hashes with a salt and verifies the password', async () => {
    const first = await hasher.hash('secret123');
    const second = await hasher.hash('secret123');

    expect(first).not.toBe('secret123');
    expect(first).not.toBe(second);
    await expect(hasher.compare('secret123', first)).resolves.toBe(true);
    await expect(hasher.compare('other', first)).resolves.toBe(false);
  });
});

describe('JwtTokenService', () => {
  const service = new JwtTokenService(SECRET, 3600);

  it('issues a token that verifies back to the user id', () => {
    const { token, expiresIn } = service.issue('u1');

    expect(expiresIn).toBe(3600);
    expect(service.verify(token)).toBe('u1');
  });

  it('401 for a token signed with another secret', () => {
    const forged = new JwtTokenService('another-secret-another-secret-12345', 3600).issue('u1').token;

    expect(() => service.verify(forged)).toThrow(expect.objectContaining({ statusCode: 401 }));
  });

  it('401 for a tampered or malformed token', () => {
    const { token } = service.issue('u1');

    expect(() => service.verify(`${token}x`)).toThrow(expect.objectContaining({ statusCode: 401 }));
    expect(() => service.verify('not-a-token')).toThrow(expect.objectContaining({ statusCode: 401 }));
  });

  it('401 for an expired token', () => {
    const expired = jwt.sign({}, SECRET, { subject: 'u1', algorithm: 'HS256', expiresIn: -10 });

    expect(() => service.verify(expired)).toThrow(expect.objectContaining({ statusCode: 401, message: 'El token ha expirado' }));
  });

  it('401 for a token that uses the "none" algorithm', () => {
    const unsigned = jwt.sign({ sub: 'u1' }, '', { algorithm: 'none' });

    expect(() => service.verify(unsigned)).toThrow(expect.objectContaining({ statusCode: 401 }));
  });
});
