import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';

@ApiTags('Referrals')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('api-key')
@Controller('projects/:projectId/referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('stats/:memberId')
  @ApiOperation({
    summary: 'Get referral statistics, referral code, and referee history for a member',
  })
  getMemberStats(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.referralsService.getReferralStats(projectId, memberId);
  }

  @Get()
  @ApiOperation({ summary: 'List all referral conversions across this project' })
  listProjectReferrals(@Param('projectId') projectId: string) {
    return this.referralsService.listProjectReferrals(projectId);
  }
}
