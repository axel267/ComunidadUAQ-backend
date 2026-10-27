import { IsInt, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsInt()
  userId: number;

  @IsString()
  @MinLength(8)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
