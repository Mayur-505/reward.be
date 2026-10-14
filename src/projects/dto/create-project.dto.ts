import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProjectSettingsDto {
  @ApiPropertyOptional({ example: 50, description: 'Coins given to referrer' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  referralRewardCoins?: number;

  @ApiPropertyOptional({ example: 25, description: 'Coins given to referee' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  refereeRewardCoins?: number;

  @ApiPropertyOptional({ example: 10, description: 'Coins given upon registration' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  welcomeCoins?: number;

  @ApiPropertyOptional({ example: 'Coins', description: 'Name of the currency' })
  @IsString()
  @IsOptional()
  currencyName?: string;

  @ApiPropertyOptional({
    example: 168,
    description:
      'Window in hours after registration during which a member can claim a referral code (default: 168 = 7 days)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  referralClaimWindowHours?: number;

  @ApiPropertyOptional({
    example: 10,
    description:
      'Maximum number of rewarded referrals allowed per member (null / undefined for unlimited)',
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxReferralsPerMember?: number;
}

export class CreateProjectDto {
  @ApiProperty({ example: 'PocketLog', description: 'Project display name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'POCKETLOG', description: 'Unique project identifier code' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Reward app for expense tracking users' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: ProjectSettingsDto })
  @ValidateNested()
  @Type(() => ProjectSettingsDto)
  @IsOptional()
  settings?: ProjectSettingsDto;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'PocketLog Updated' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: ProjectSettingsDto })
  @ValidateNested()
  @Type(() => ProjectSettingsDto)
  @IsOptional()
  settings?: ProjectSettingsDto;
}
