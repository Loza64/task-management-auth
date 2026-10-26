import 'reflect-metadata';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';

const check = <T extends object>(dto: ClassConstructor<T>, body: unknown) =>
  validate(plainToInstance(dto, body), { whitelist: true, forbidNonWhitelisted: true });

describe('auth DTOs', () => {
  const valid = { name: 'Ana', username: 'ana.lopez', password: 'secret123' };

  it('accepts a valid registration and normalizes the username', async () => {
    expect(await check(RegisterDto, valid)).toHaveLength(0);
    expect(plainToInstance(RegisterDto, { ...valid, username: '  Ana.LOPEZ ' }).username).toBe('ana.lopez');
  });

  it.each([
    ['name too short', { ...valid, name: 'A' }],
    ['username too short', { ...valid, username: 'ab' }],
    ['username too long', { ...valid, username: 'a'.repeat(31) }],
    ['username with spaces', { ...valid, username: 'ana lopez' }],
    ['username with symbols', { ...valid, username: 'ana@lopez' }],
    ['password too short', { ...valid, password: 'abc123' }],
    ['password without number', { ...valid, password: 'onlyletters' }],
    ['password without letter', { ...valid, password: '12345678' }],
    ['password longer than 72', { ...valid, password: `a1${'x'.repeat(71)}` }],
    ['unknown field', { ...valid, role: 'admin' }],
  ])('rejects registration: %s', async (_label, body) => {
    expect((await check(RegisterDto, body)).length).toBeGreaterThan(0);
  });

  it('validates login', async () => {
    expect(await check(LoginDto, { username: 'ana', password: 'x' })).toHaveLength(0);
    expect(plainToInstance(LoginDto, { username: ' ANA ', password: 'x' }).username).toBe('ana');
    expect((await check(LoginDto, { username: 'ana', password: '' })).length).toBeGreaterThan(0);
    expect((await check(LoginDto, { username: '', password: 'x' })).length).toBeGreaterThan(0);
    expect((await check(LoginDto, { email: 'ana@example.com', password: 'x' })).length).toBeGreaterThan(0);
  });
});
