import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MembersService } from '../members/members.service';
import { CoinTransactionType } from '../members/schemas/coin-transaction.schema';
import { ProjectsService } from '../projects/projects.service';
import {
  CreateGiftCardDto,
  FulfillRedemptionDto,
  RedeemGiftCardDto,
} from './dto/create-gift-card.dto';
import {
  GiftCardRedemption,
  GiftCardRedemptionDocument,
  RedemptionStatus,
} from './schemas/gift-card-redemption.schema';
import { GiftCard, GiftCardDocument } from './schemas/gift-card.schema';

@Injectable()
export class GiftCardsService {
  constructor(
    @InjectModel(GiftCard.name)
    private readonly giftCardModel: Model<GiftCardDocument>,
    @InjectModel(GiftCardRedemption.name)
    private readonly redemptionModel: Model<GiftCardRedemptionDocument>,
    private readonly membersService: MembersService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(
    projectId: string,
    dto: CreateGiftCardDto,
  ): Promise<GiftCardDocument> {
    const project = await this.projectsService.findById(projectId);

    const giftCard = new this.giftCardModel({
      projectId: project._id,
      title: dto.title,
      description: dto.description ?? '',
      coinCost: dto.coinCost,
      imageUrl: dto.imageUrl ?? '',
      stock: dto.stock ?? -1,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return giftCard.save();
  }

  async listProjectGiftCards(projectId: string): Promise<GiftCardDocument[]> {
    const project = await this.projectsService.findById(projectId);
    return this.giftCardModel
      .find({
        projectId: project._id,
        isActive: true,
      })
      .sort({ coinCost: 1 })
      .exec();
  }

  async getGiftCardById(
    projectId: string,
    id: string,
  ): Promise<GiftCardDocument> {
    const project = await this.projectsService.findById(projectId);
    const card = await this.giftCardModel
      .findOne({
        _id: new Types.ObjectId(id),
        projectId: project._id,
      })
      .exec();

    if (!card) {
      throw new NotFoundException(`Gift card '${id}' not found in project`);
    }

    return card;
  }

  async redeemGiftCard(
    projectId: string,
    giftCardId: string,
    dto: RedeemGiftCardDto,
  ): Promise<GiftCardRedemptionDocument> {
    const project = await this.projectsService.findById(projectId);
    const giftCard = await this.getGiftCardById(projectId, giftCardId);

    if (!giftCard.isActive) {
      throw new BadRequestException('This gift card is currently unavailable');
    }

    if (giftCard.stock === 0) {
      throw new BadRequestException('This gift card is out of stock');
    }

    // 1. Debit coins from member
    await this.membersService.debitCoins(
      projectId,
      dto.memberId,
      giftCard.coinCost,
      CoinTransactionType.GIFT_CARD_REDEEM,
      `Redeemed reward: ${giftCard.title}`,
      { giftCardId: giftCard._id },
    );

    // 2. Decrement stock if finite
    if (giftCard.stock > 0) {
      giftCard.stock -= 1;
      await giftCard.save();
    }

    // 3. Create Redemption record
    const redemption = new this.redemptionModel({
      projectId: project._id,
      memberId: new Types.ObjectId(dto.memberId),
      giftCardId: giftCard._id,
      coinCost: giftCard.coinCost,
      status: RedemptionStatus.PENDING,
    });

    return redemption.save();
  }

  async fulfillRedemption(
    projectId: string,
    redemptionId: string,
    dto: FulfillRedemptionDto,
  ): Promise<GiftCardRedemptionDocument> {
    const project = await this.projectsService.findById(projectId);
    const redemption = await this.redemptionModel
      .findOne({
        _id: new Types.ObjectId(redemptionId),
        projectId: project._id,
      })
      .exec();

    if (!redemption) {
      throw new NotFoundException(
        `Redemption request '${redemptionId}' not found`,
      );
    }

    // If previously not rejected, but now rejected: refund coins!
    if (
      dto.status === RedemptionStatus.REJECTED &&
      redemption.status !== RedemptionStatus.REJECTED
    ) {
      await this.membersService.creditCoins(
        projectId,
        (redemption.memberId as any).toString(),
        redemption.coinCost,
        CoinTransactionType.ADMIN_ADJUSTMENT,
        `Refund for rejected redemption: ${redemptionId}`,
        { redemptionId: redemption._id },
      );
    }

    redemption.status = dto.status;
    if (dto.voucherCode !== undefined) redemption.voucherCode = dto.voucherCode;
    if (dto.adminNote !== undefined) redemption.adminNote = dto.adminNote;
    redemption.processedAt = new Date();

    return redemption.save();
  }

  async listRedemptions(
    projectId: string,
  ): Promise<GiftCardRedemptionDocument[]> {
    const project = await this.projectsService.findById(projectId);
    return this.redemptionModel
      .find({ projectId: project._id })
      .populate('memberId', 'externalUserId name email')
      .populate('giftCardId', 'title coinCost imageUrl')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getMemberRedemptions(
    projectId: string,
    memberId: string,
  ): Promise<GiftCardRedemptionDocument[]> {
    const project = await this.projectsService.findById(projectId);
    return this.redemptionModel
      .find({
        projectId: project._id,
        memberId: new Types.ObjectId(memberId),
      })
      .populate('giftCardId', 'title coinCost imageUrl')
      .sort({ createdAt: -1 })
      .exec();
  }
}
