import { IsEnum, IsOptional } from 'class-validator';
import { SearchQueryDto } from '../../../shared/pagination/pagination-query.dto';
import { TaskStatus } from '../domain/task.entity';

export class TaskQueryDto extends SearchQueryDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
