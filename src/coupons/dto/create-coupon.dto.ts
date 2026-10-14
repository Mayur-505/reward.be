import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({
    example: 'WELCOME100',
    description: 'Universal promo code (shared across all projects)',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 100,
    description: 'Coins awarded to the redeeming member in their project',
  })
  @IsNumber()
  @Min(1)
  rewardCoins: number;

  @ApiPropertyOptional({
    example: 500,
    description: 'Total global redemptions allowed across all projects (-1 for unlimited)',
  })
  @IsNumber()
  @IsOptional()
  maxGlobalUses?: number;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Optional expiration timestamp',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({
    example: 'New Year universal campaign',
    description: 'Description of the campaign',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true, description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class RedeemCouponDto {
  @ApiProperty({
    example: 'WELCOME100',
    description: 'Universal coupon code to redeem',
  })
  @IsString()
  @IsNotEmpty()
  couponCode: string;

  @ApiProperty({
    example: '6605df93a40498b0f19c32de',
    description: 'Member ID in this project receiving the reward',
  })
  @IsString()
  @IsNotEmpty()
  memberId: string;
}
