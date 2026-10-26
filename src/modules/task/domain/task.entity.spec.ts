
import { Task, TaskStatus } from './task.entity';

describe('Task', () => {
  it('starts as pending and not completed', () => {
    const task = new Task();

    expect(task.status).toBe(TaskStatus.PENDING);
    expect(task.completedAt).toBeNull();
  });

  it('sets completedAt when completed and clears it when reopened', () => {
    const task = new Task();

    task.changeStatus(TaskStatus.COMPLETED);
    expect(task.status).toBe(TaskStatus.COMPLETED);
    expect(task.completedAt).toBeInstanceOf(Date);

    task.changeStatus(TaskStatus.IN_PROGRESS);
    expect(task.status).toBe(TaskStatus.IN_PROGRESS);
    expect(task.completedAt).toBeNull();
  });

  it('409 when the status does not change', () => {
    const task = new Task();

    expect(() => task.changeStatus(TaskStatus.PENDING)).toThrow(expect.objectContaining({ statusCode: 409 }));
  });
});
