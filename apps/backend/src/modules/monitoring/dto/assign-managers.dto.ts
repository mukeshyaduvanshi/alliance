import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class AssignManagersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  userIds!: string[];
}
