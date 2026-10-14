import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateGiftCardDto,
  FulfillRedemptionDto,
  RedeemGiftCardDto,
} from './dto/create-gift-card.dto';
import { GiftCardsService } from './gift-cards.service';

@ApiTags('Gift Cards')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('api-key')
@Controller('projects/:projectId/gift-cards')
export class GiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new gift card item in project catalog' })
  @ApiResponse({ status: 201, description: 'Gift card created' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateGiftCardDto,
  ) {
    return this.giftCardsService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all available gift cards in this project' })
  listGiftCards(@Param('projectId') projectId: string) {
    return this.giftCardsService.listProjectGiftCards(projectId);
  }

  @Post(':id/redeem')
  @ApiOperation({
    summary: 'Member redeems a gift card using project coin balance',
    description:
      'Validates coin balance, deducts coins, decreases inventory, and creates a redemption request.',
  })
  redeem(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: RedeemGiftCardDto,
  ) {
    return this.giftCardsService.redeemGiftCard(projectId, id, dto);
  }

  @Get('redemptions')
  @ApiOperation({ summary: 'List all gift card redemption requests for this project' })
  listRedemptions(@Param('projectId') projectId: string) {
    return this.giftCardsService.listRedemptions(projectId);
  }

  @Get('redemptions/member/:memberId')
  @ApiOperation({ summary: 'List redemption history for a specific member' })
  getMemberRedemptions(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.giftCardsService.getMemberRedemptions(projectId, memberId);
  }

  @Put('redemptions/:redemptionId/fulfill')
  @ApiOperation({
    summary: 'Approve, deliver, or reject a redemption request',
    description:
      'If rejected, coins are automatically refunded back to the member.',
  })
  fulfillRedemption(
    @Param('projectId') projectId: string,
    @Param('redemptionId') redemptionId: string,
    @Body() dto: FulfillRedemptionDto,
  ) {
    return this.giftCardsService.fulfillRedemption(projectId, redemptionId, dto);
  }
}
