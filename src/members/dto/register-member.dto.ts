import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RegisterMemberDto {
  @ApiProperty({
    example: 'user_12345',
    description: 'Unique user identifier from your client app',
  })
  @IsString()
  @IsNotEmpty()
  externalUserId: string;

  @ApiPropertyOptional({ example: 'Alice Smith', description: 'Display name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'alice@example.com',
    description: 'Email address',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'REF1234',
    description: 'Optional referral code used during onboarding',
  })
  @IsString()
  @IsOptional()
  referralCode?: string;
}

export class AdjustCoinsDto {
  @ApiProperty({
    example: 100,
    description: 'Amount of coins to credit (positive) or debit (negative)',
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: 'Bonus campaign reward',
    description: 'Reason for the adjustment',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
