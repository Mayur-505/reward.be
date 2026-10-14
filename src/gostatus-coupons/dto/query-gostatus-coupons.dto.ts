import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryGostatusCouponsDto {
  @ApiPropertyOptional({
    description: 'Search keyword across brand name and title',
    example: 'nike',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific brand name',
    example: 'Fable Home US',
  })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({
    description: 'Filter by 2-letter country code (e.g. IN, US)',
    example: 'US',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Number of coupons per page (max 100)',
    default: 50,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Sorting criteria',
    enum: ['coins_asc', 'coins_desc', 'newest'],
    default: 'newest',
  })
  @IsString()
  @IsOptional()
  sort?: 'coins_asc' | 'coins_desc' | 'newest' = 'newest';
}
