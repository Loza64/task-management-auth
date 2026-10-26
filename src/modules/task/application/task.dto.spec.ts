
import 'reflect-metadata';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChangeTaskStatusDto } from './change-task-status.dto';
import { CreateTaskDto } from './create-task.dto';
import { TaskQueryDto } from './task-query.dto';
import { UpdateTaskDto } from './update-task.dto';

const check = <T extends object>(dto: ClassConstructor<T>, body: unknown) =>
  validate(plainToInstance(dto, body), { whitelist: true, forbidNonWhitelisted: true });

describe('task DTOs', () => {
  describe('CreateTaskDto', () => {
    it('accepts a title with optional description', async () => {
      expect(await check(CreateTaskDto, { title: 'Comprar pan' })).toHaveLength(0);
      expect(await check(CreateTaskDto, { title: 'Comprar pan', description: 'Integral' })).toHaveLength(0);
    });

    it.each([
      ['title missing', {}],
      ['title too short', { title: 'ab' }],
      ['title only spaces', { title: '      ' }],
      ['title too long', { title: 'x'.repeat(121) }],
      ['title not a string', { title: 123 }],
      ['description too long', { title: 'Válido', description: 'x'.repeat(1001) }],
      ['status is not allowed on creation', { title: 'Válido', status: 'completed' }],
    ])('rejects: %s', async (_label, body) => {
      expect((await check(CreateTaskDto, body)).length).toBeGreaterThan(0);
    });
  });

  describe('UpdateTaskDto', () => {
    it('accepts partial updates and null to clear the description', async () => {
      expect(await check(UpdateTaskDto, { title: 'Nuevo título' })).toHaveLength(0);
      expect(await check(UpdateTaskDto, { description: null })).toHaveLength(0);
    });

    it('rejects changing the status through the generic update', async () => {
      expect((await check(UpdateTaskDto, { status: 'completed' })).length).toBeGreaterThan(0);
    });
  });

  describe('ChangeTaskStatusDto', () => {
    it.each(['pending', 'in_progress', 'completed'])('accepts %s', async (status) => {
      expect(await check(ChangeTaskStatusDto, { status })).toHaveLength(0);
    });

    it.each([{}, { status: 'done' }, { status: 1 }])('rejects %j', async (body) => {
      expect((await check(ChangeTaskStatusDto, body)).length).toBeGreaterThan(0);
    });
  });

  describe('TaskQueryDto', () => {
    it('accepts a valid status filter', async () => {
      expect(await check(TaskQueryDto, { status: 'pending', page: '2' })).toHaveLength(0);
    });

    it('rejects an unknown status filter', async () => {
      expect((await check(TaskQueryDto, { status: 'borrada' })).length).toBeGreaterThan(0);
    });
  });
});
