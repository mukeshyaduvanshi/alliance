import { IsString } from 'class-validator';

export class SubmitArtworkDto {
  @IsString()
  fileUrl!: string;

  @IsString()
  fileName!: string;
}
