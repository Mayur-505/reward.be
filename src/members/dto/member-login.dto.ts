import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class MemberLoginDto {
  @ApiProperty({
    example: 'user_12345',
    description: 'Unique user identifier from your client app (e.g. Firebase UID, device ID, user ID)',
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
    example: 'POCK9A3F12',
    description: 'Optional referral code used during onboarding for referral bonus',
  })
  @IsString()
  @IsOptional()
  referralCode?: string;
}

export class MemberProfileDto {
  @ApiProperty({ example: '6605df93a40498b0f19c32de' })
  _id: string;

  @ApiProperty({ example: '6605df93a40498b0f19c32df' })
  projectId: string;

  @ApiProperty({ example: 'user_12345' })
  externalUserId: string;

  @ApiProperty({ example: 'Alice Smith' })
  name: string;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiProperty({ example: 100, description: 'Current spendable coin balance' })
  coinBalance: number;

  @ApiProperty({ example: 100, description: 'Lifetime earned coins' })
  totalEarnedCoins: number;

  @ApiProperty({ example: 0, description: 'Lifetime spent coins' })
  totalSpentCoins: number;

  @ApiProperty({ example: 'POCK9A3F12', description: 'Member personal referral code' })
  referralCode: string;

  @ApiPropertyOptional({ example: 'POCK559443', description: 'Referral code of inviter' })
  referredBy?: string;
}

export class MemberAuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Bearer token for authenticating member /api/me requests',
  })
  accessToken: string;

  @ApiProperty({ type: MemberProfileDto })
  member: MemberProfileDto;
}

export class RedeemMyCouponDto {
  @ApiProperty({
    example: 'WELCOME100',
    description: 'Universal promo code to redeem for your wallet',
  })
  @IsString()
  @IsNotEmpty()
  couponCode: string;
}

export class ClaimReferralDto {
  @ApiProperty({
    example: 'ARRO91199F',
    description: 'Referral code to claim for onboarding bonus (4 to 16 characters)',
  })
  @IsString()
  @Length(4, 16)
  referralCode: string;
}

export class ClaimReferralResponseDto {
  @ApiProperty({ type: MemberProfileDto })
  member: MemberProfileDto;

  @ApiProperty({ example: 25, description: 'Coins awarded to referee' })
  refereeCoinsAwarded: number;

  @ApiProperty({ example: 50, description: 'Coins awarded to referrer' })
  referrerCoinsAwarded: number;
}

