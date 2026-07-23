import { IsEmail, IsString } from 'class-validator';

export class VendorLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
