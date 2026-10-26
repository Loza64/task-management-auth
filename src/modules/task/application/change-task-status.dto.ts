import { IsEnum } from 'class-validator';
import { TaskStatus } from '../domain/task.entity';

export class ChangeTaskStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}
