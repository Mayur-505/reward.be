import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { RedemptionStatus } from '../schemas/gift-card-redemption.schema';

export class CreateGiftCardDto {
  @ApiProperty({ example: '$10 Amazon Gift Card', description: 'Gift card name' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Digital voucher redeemable on Amazon.com' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1000, description: 'Required coin cost to redeem' })
  @IsNumber()
  @Min(1)
  coinCost: number;

  @ApiPropertyOptional({
    example: 'https://example.com/amazon-card.png',
    description: 'Image URL',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 50,
    description: 'Available inventory (-1 for infinite)',
  })
  @IsNumber()
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ example: true, description: 'Active state' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class RedeemGiftCardDto {
  @ApiProperty({
    example: '6605df93a40498b0f19c32de',
    description: 'Project member ID redeeming the card',
  })
  @IsString()
  @IsNotEmpty()
  memberId: string;
}

export class FulfillRedemptionDto {
  @ApiProperty({
    enum: RedemptionStatus,
    example: RedemptionStatus.DELIVERED,
    description: 'Updated redemption status',
  })
  @IsEnum(RedemptionStatus)
  status: RedemptionStatus;

  @ApiPropertyOptional({
    example: 'AMZN-XXXX-YYYY-ZZZZ',
    description: 'Digital gift card code or voucher secret',
  })
  @IsString()
  @IsOptional()
  voucherCode?: string;

  @ApiPropertyOptional({
    example: 'Processed and sent via email',
    description: 'Admin review note',
  })
  @IsString()
  @IsOptional()
  adminNote?: string;
}
