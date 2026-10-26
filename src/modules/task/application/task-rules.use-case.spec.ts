import { UserRepository } from '../../user/domain/user.repository';
import { Task, TaskStatus } from '../domain/task.entity';
import { TaskRepository } from '../domain/task.repository';
import { ChangeTaskStatusUseCase } from './change-task-status.use-case';
import { CompleteTaskUseCase } from './complete-task.use-case';
import { CreateTaskUseCase } from './create-task.use-case';
import { DeleteTaskUseCase } from './delete-task.use-case';
import { FindTaskByIdUseCase } from './find-task-by-id.use-case';
import { UpdateTaskUseCase } from './update-task.use-case';

const ID = '507f1f77bcf86cd799439011';
const USER_ID = '507f1f77bcf86cd799439022';
const makeTask = (status = TaskStatus.PENDING) =>
  Object.assign(new Task(), { id: ID, userId: USER_ID, title: 'Escribir informe', status });

describe('task business rules', () => {
  const taskRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<TaskRepository>;

  const userRepository = {
    findById: jest.fn(),
    findAll: jest.fn(),
    findByUsername: jest.fn(),
    create: jest.fn(),
    addTask: jest.fn(),
    removeTask: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.resetAllMocks();
    taskRepository.save.mockImplementation(async (task) => Object.assign(task, { id: task.id || ID }));
  });

  describe('CreateTaskUseCase', () => {
    const useCase = new CreateTaskUseCase(taskRepository, userRepository);

    it('creates a pending task owned by the user and links it to the user', async () => {
      const task = await useCase.execute(USER_ID, { title: 'Nueva', description: '' });

      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.description).toBeNull();
      expect(task.userId).toBe(USER_ID);
      expect(userRepository.addTask).toHaveBeenCalledWith(USER_ID, ID);
    });

    it('removes the task and rethrows when linking it to the user fails', async () => {
      userRepository.addTask.mockRejectedValue(new Error('db down'));
      taskRepository.delete.mockResolvedValue(true);

      await expect(useCase.execute(USER_ID, { title: 'Nueva' })).rejects.toThrow('db down');
      expect(taskRepository.delete).toHaveBeenCalledWith(ID, USER_ID);
    });
  });

  describe('FindTaskByIdUseCase', () => {
    it('404 when the task does not exist or belongs to another user', async () => {
      taskRepository.findById.mockResolvedValue(null);

      await expect(new FindTaskByIdUseCase(taskRepository).execute(ID, USER_ID)).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(taskRepository.findById).toHaveBeenCalledWith(ID, USER_ID);
    });
  });

  describe('UpdateTaskUseCase', () => {
    const useCase = new UpdateTaskUseCase(taskRepository);

    it('400 when no field is sent', async () => {
      await expect(useCase.execute(ID, USER_ID, {})).rejects.toMatchObject({ statusCode: 400 });
      expect(taskRepository.findById).not.toHaveBeenCalled();
    });

    it('404 when the task is not found for that user', async () => {
      taskRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(ID, USER_ID, { title: 'Otro' })).rejects.toMatchObject({ statusCode: 404 });
      expect(taskRepository.save).not.toHaveBeenCalled();
    });

    it('updates the fields without touching the status', async () => {
      taskRepository.findById.mockResolvedValue(makeTask(TaskStatus.IN_PROGRESS));

      const updated = await useCase.execute(ID, USER_ID, { title: 'Otro título', description: null });

      expect(updated.title).toBe('Otro título');
      expect(updated.description).toBeNull();
      expect(updated.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });

  describe('ChangeTaskStatusUseCase', () => {
    const useCase = new ChangeTaskStatusUseCase(taskRepository);

    it('404 when the task is not found for that user', async () => {
      taskRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(ID, USER_ID, TaskStatus.IN_PROGRESS)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('409 when the task already has that status', async () => {
      taskRepository.findById.mockResolvedValue(makeTask(TaskStatus.IN_PROGRESS));

      await expect(useCase.execute(ID, USER_ID, TaskStatus.IN_PROGRESS)).rejects.toMatchObject({ statusCode: 409 });
      expect(taskRepository.save).not.toHaveBeenCalled();
    });

    it('moves the task to the new status', async () => {
      taskRepository.findById.mockResolvedValue(makeTask());

      const updated = await useCase.execute(ID, USER_ID, TaskStatus.IN_PROGRESS);

      expect(updated.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });

  describe('CompleteTaskUseCase', () => {
    const useCase = new CompleteTaskUseCase(new ChangeTaskStatusUseCase(taskRepository));

    it('completes the task and records completedAt', async () => {
      taskRepository.findById.mockResolvedValue(makeTask(TaskStatus.IN_PROGRESS));

      const completed = await useCase.execute(ID, USER_ID);

      expect(completed.status).toBe(TaskStatus.COMPLETED);
      expect(completed.completedAt).toBeInstanceOf(Date);
    });

    it('409 when the task is already completed', async () => {
      taskRepository.findById.mockResolvedValue(makeTask(TaskStatus.COMPLETED));

      await expect(useCase.execute(ID, USER_ID)).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('DeleteTaskUseCase', () => {
    const useCase = new DeleteTaskUseCase(taskRepository, userRepository);

    it('404 when the task is not found for that user and does not touch the user', async () => {
      taskRepository.delete.mockResolvedValue(false);

      await expect(useCase.execute(ID, USER_ID)).rejects.toMatchObject({ statusCode: 404 });
      expect(userRepository.removeTask).not.toHaveBeenCalled();
    });

    it('deletes the task and unlinks it from the user', async () => {
      taskRepository.delete.mockResolvedValue(true);

      await expect(useCase.execute(ID, USER_ID)).resolves.toBeUndefined();
      expect(taskRepository.delete).toHaveBeenCalledWith(ID, USER_ID);
      expect(userRepository.removeTask).toHaveBeenCalledWith(USER_ID, ID);
    });
  });
});
