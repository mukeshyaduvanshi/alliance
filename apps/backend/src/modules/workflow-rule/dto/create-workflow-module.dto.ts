import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class CreateWorkflowModuleDto {
  @IsString()
  @Matches(/^[a-z_]+$/, {
    message: 'Module name must be lowercase snake_case (e.g. brand_order)',
  })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
