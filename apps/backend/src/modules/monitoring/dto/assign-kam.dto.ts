import { IsUUID } from 'class-validator';

export class AssignKamDto {
  @IsUUID()
  kamUserId!: string;
}
