import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({ example: '6605df93a40498b0f19c32de' })
  _id: string;

  @ApiProperty({ example: 'alex@example.com' })
  email: string;

  @ApiProperty({ example: 'Alex Morgan' })
  name: string;

  @ApiProperty({ example: ['user'] })
  roles: string[];

  @ApiProperty({ example: '2026-10-12T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-12T10:00:00.000Z' })
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT Access Token' })
  accessToken: string;

  @ApiProperty({ type: UserProfileResponseDto })
  user: UserProfileResponseDto;
}
