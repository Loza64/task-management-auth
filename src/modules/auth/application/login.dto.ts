import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const normalizeUsername = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginDto {
  @Transform(normalizeUsername)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}
