import { IsEmail, IsString } from 'class-validator';

export class BrandLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
