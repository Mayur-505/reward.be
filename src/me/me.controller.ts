import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentMember } from '../common/decorators/current-member.decorator';
import { CouponsService } from '../coupons/coupons.service';
import { GiftCardsService } from '../gift-cards/gift-cards.service';
import { QueryGostatusCouponsDto } from '../gostatus-coupons/dto/query-gostatus-coupons.dto';
import { GostatusCouponsService } from '../gostatus-coupons/gostatus-coupons.service';
import {
  ClaimReferralDto,
  ClaimReferralResponseDto,
  MemberProfileDto,
  RedeemMyCouponDto,
} from '../members/dto/member-login.dto';
import { MembersService } from '../members/members.service';
import { ProjectMemberDocument } from '../members/schemas/project-member.schema';
import { ReferralsService } from '../referrals/referrals.service';

@ApiTags('My Account (End-User / Mobile)')
@ApiBearerAuth('JWT-auth')
@Controller('me')
export class MeController {
  constructor(
    private readonly membersService: MembersService,
    private readonly referralsService: ReferralsService,
    private readonly giftCardsService: GiftCardsService,
    private readonly couponsService: CouponsService,
    private readonly gostatusCouponsService: GostatusCouponsService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current member profile and coin balance' })
  @ApiResponse({ status: 200, type: MemberProfileDto })
  async getProfile(@CurrentMember() member: ProjectMemberDocument) {
    return this.membersService.getMemberById(
      member.projectId.toString(),
      (member._id as any).toString(),
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get current member coin transaction ledger history' })
  async getTransactions(@CurrentMember() member: ProjectMemberDocument) {
    return this.membersService.getTransactionHistory(
      member.projectId.toString(),
      (member._id as any).toString(),
    );
  }

  @Get('referrals')
  @ApiOperation({
    summary: 'Get current member referral code, stats, and invited friends list',
  })
  async getReferrals(@CurrentMember() member: ProjectMemberDocument) {
    return this.referralsService.getReferralStats(
      member.projectId.toString(),
      (member._id as any).toString(),
    );
  }

  @Post('referral')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Claim a referral code later for onboarding bonus',
    description:
      'Applies an invitation referral code to the current member account within the allowed time window, rewarding both the referee and referrer.',
  })
  @ApiResponse({ status: 200, type: ClaimReferralResponseDto })
  @ApiResponse({ status: 400, description: 'Own code used or loop detected' })
  @ApiResponse({ status: 403, description: 'Referral window has expired' })
  @ApiResponse({ status: 404, description: 'Invalid referral code' })
  @ApiResponse({ status: 409, description: 'Referral code already used' })
  async claimReferral(
    @CurrentMember() member: ProjectMemberDocument,
    @Body() dto: ClaimReferralDto,
  ) {
    return this.membersService.claimReferralCode(
      member.projectId.toString(),
      (member._id as any).toString(),
      dto.referralCode,
    );
  }

  @Get('gift-cards')
  @ApiOperation({ summary: 'Get available gift cards catalog for current project' })
  async getGiftCards(@CurrentMember() member: ProjectMemberDocument) {
    return this.giftCardsService.listProjectGiftCards(member.projectId.toString());
  }

  @Post('gift-cards/:id/redeem')
  @ApiOperation({ summary: 'Redeem a gift card using current member coin balance' })
  async redeemGiftCard(
    @CurrentMember() member: ProjectMemberDocument,
    @Param('id') giftCardId: string,
  ) {
    return this.giftCardsService.redeemGiftCard(
      member.projectId.toString(),
      giftCardId,
      { memberId: (member._id as any).toString() },
    );
  }

  @Get('gift-cards/redemptions')
  @ApiOperation({ summary: 'Get current member gift card redemption history' })
  async getRedemptions(@CurrentMember() member: ProjectMemberDocument) {
    return this.giftCardsService.getMemberRedemptions(
      member.projectId.toString(),
      (member._id as any).toString(),
    );
  }

  @Post('coupons/redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem a universal coupon code for current member' })
  async redeemCoupon(
    @CurrentMember() member: ProjectMemberDocument,
    @Body() dto: RedeemMyCouponDto,
  ) {
    return this.couponsService.redeemCoupon(
      member.projectId.toString(),
      {
        couponCode: dto.couponCode,
        memberId: (member._id as any).toString(),
      },
    );
  }

  @Get('gostatus-coupons')
  @ApiOperation({
    summary: 'Browse available Gostatus / Feedico partner coupons',
    description: 'List coupons with search, brand filtering, country filter, and coin cost sorting.',
  })
  async listGostatusCoupons(
    @CurrentMember() member: ProjectMemberDocument,
    @Query() query: QueryGostatusCouponsDto,
  ) {
    return this.gostatusCouponsService.findCoupons(query);
  }

  @Post('gostatus-coupons/:id/redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Redeem a partner coupon using current member coins',
    description:
      'Deducts costCoins from member wallet and unlocks the coupon promo code & redemption details.',
  })
  async redeemGostatusCoupon(
    @CurrentMember() member: ProjectMemberDocument,
    @Param('id') couponId: string,
  ) {
    return this.gostatusCouponsService.redeemCoupon(
      member.projectId.toString(),
      (member._id as any).toString(),
      couponId,
    );
  }

  @Get('gostatus-coupons/my-coupons')
  @ApiOperation({
    summary: 'Get all partner coupons redeemed by current member',
    description: 'Returns list of redeemed partner coupons with unlocked promo codes and URLs.',
  })
  async getMyGostatusCoupons(@CurrentMember() member: ProjectMemberDocument) {
    return this.gostatusCouponsService.getMemberRedemptions(
      member.projectId.toString(),
      (member._id as any).toString(),
    );
  }
}
