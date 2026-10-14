import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AdjustCoinsDto, RegisterMemberDto } from './dto/register-member.dto';
import { MemberAuthResponseDto, MemberLoginDto } from './dto/member-login.dto';
import { MembersService } from './members.service';

@ApiTags('Members & Wallet')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('api-key')
@Controller('projects/:projectId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Member login & onboarding (Client / Mobile App)',
    description:
      'Public endpoint for mobile/client apps to log in or register end-users. Returns a Member JWT token for accessing /api/me routes.',
  })
  @ApiResponse({
    status: 201,
    description: 'Member authenticated successfully',
    type: MemberAuthResponseDto,
  })
  login(
    @Param('projectId') projectId: string,
    @Body() dto: MemberLoginDto,
  ) {
    return this.membersService.loginMember(projectId, dto);
  }

  @Post()
  @ApiOperation({
    summary: 'Onboard or fetch a member in a specific project',
    description:
      'Creates a project-scoped wallet, generates a project-specific referral code, and awards welcome/referral bonuses.',
  })
  @ApiResponse({ status: 201, description: 'Member registered/fetched successfully' })
  register(
    @Param('projectId') projectId: string,
    @Body() dto: RegisterMemberDto,
  ) {
    return this.membersService.registerOrFindMember(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all members belonging to a project' })
  listMembers(@Param('projectId') projectId: string) {
    return this.membersService.listMembers(projectId);
  }

  @Get(':memberId')
  @ApiOperation({ summary: 'Get member details, balance, and referral code' })
  getMember(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.getMemberById(projectId, memberId);
  }

  @Get(':memberId/transactions')
  @ApiOperation({ summary: 'Get coin balance transaction history for a member' })
  getTransactions(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.getTransactionHistory(projectId, memberId);
  }

  @Post(':memberId/adjust-coins')
  @ApiOperation({ summary: 'Adjust member coin balance (credit or debit)' })
  adjustCoins(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Body() dto: AdjustCoinsDto,
  ) {
    return this.membersService.adjustCoins(projectId, memberId, dto);
  }
}
