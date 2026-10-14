import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { CouponsService } from './coupons.service';
import { CreateCouponDto, RedeemCouponDto } from './dto/create-coupon.dto';

@ApiTags('Universal Coupons')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('api-key')
@Controller()
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('coupons')
  @ApiOperation({
    summary: 'Create a universal coupon (shared across all projects)',
    description:
      'Creates a universal promo code that can be used by members of any project to earn that project coins.',
  })
  @ApiResponse({ status: 201, description: 'Universal coupon created' })
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Get('coupons')
  @ApiOperation({ summary: 'List all universal coupons' })
  listCoupons() {
    return this.couponsService.findAll();
  }

  @Get('coupons/:code')
  @ApiOperation({ summary: 'Get details of a universal coupon by code' })
  getCouponByCode(@Param('code') code: string) {
    return this.couponsService.findByCode(code);
  }

  @Post('projects/:projectId/coupons/redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Redeem a universal coupon into a project member wallet',
    description:
      'Validates the universal coupon and credits coins to the member project wallet. Each member can only redeem this coupon once per project.',
  })
  @ApiResponse({ status: 200, description: 'Coupon redeemed successfully' })
  redeemCoupon(
    @Param('projectId') projectId: string,
    @Body() dto: RedeemCouponDto,
  ) {
    return this.couponsService.redeemCoupon(projectId, dto);
  }

  @Get('projects/:projectId/coupons/redemptions')
  @ApiOperation({ summary: 'List all coupon redemptions for a specific project' })
  listProjectRedemptions(@Param('projectId') projectId: string) {
    return this.couponsService.listRedemptionsForProject(projectId);
  }
}
