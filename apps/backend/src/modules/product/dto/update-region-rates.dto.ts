import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RegionRateInput } from './create-product.dto';

export class UpdateRegionRatesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegionRateInput)
  regionRates!: RegionRateInput[];
}
