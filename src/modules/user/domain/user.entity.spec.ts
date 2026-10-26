import { Task } from '../../task/domain/task.entity';
import { User } from './user.entity';

describe('User', () => {
  const makeUser = () => Object.assign(new User(), { id: 'u1', name: 'Ana', username: 'ana', password: 'hash' });

  it('never exposes the password', () => {
    const publicUser = makeUser().toPublic();

    expect(publicUser).not.toHaveProperty('password');
    expect(publicUser).not.toHaveProperty('tasks');
  });

  it('includes its tasks only when they are loaded, without repeating the user inside each task', () => {
    const user = makeUser();
    user.tasks = [Object.assign(new Task(), { id: 't1', title: 'Tarea uno', userId: 'u1' })];

    const publicUser = user.toPublic();

    expect(publicUser.tasks).toHaveLength(1);
    expect(publicUser.tasks?.[0]).toMatchObject({ id: 't1', title: 'Tarea uno' });
    expect(publicUser.tasks?.[0]).not.toHaveProperty('user');
  });

  it('a task exposes its owner without the password', () => {
    const task = Object.assign(new Task(), { id: 't1', title: 'Tarea uno', userId: 'u1', user: makeUser() });

    const owner = task.toPublic().user;

    expect(owner).toMatchObject({ id: 'u1', name: 'Ana', username: 'ana' });
    expect(owner).not.toHaveProperty('password');
    expect(owner).not.toHaveProperty('tasks');
  });
});
