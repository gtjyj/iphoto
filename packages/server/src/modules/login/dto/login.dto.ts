import { IsNotEmpty } from '@nestjs/class-validator';

export class LoginDto {
  @IsNotEmpty()
  password: string;
}
