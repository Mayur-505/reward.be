import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MembersService } from '../members/members.service';
import { CoinTransactionType } from '../members/schemas/coin-transaction.schema';
import { QueryGostatusCouponsDto } from './dto/query-gostatus-coupons.dto';
import {
  GostatusCoupon,
  GostatusCouponDocument,
} from './schemas/gostatus-coupon.schema';
import {
  GostatusCouponRedemption,
  GostatusCouponRedemptionDocument,
} from './schemas/gostatus-redemption.schema';

@Injectable()
export class GostatusCouponsService {
  constructor(
    @InjectModel(GostatusCoupon.name)
    private readonly couponModel: Model<GostatusCouponDocument>,
    @InjectModel(GostatusCouponRedemption.name)
    private readonly redemptionModel: Model<GostatusCouponRedemptionDocument>,
    private readonly membersService: MembersService,
  ) {}

  /**
   * Browse synced Gostatus coupons with search, filter, and pagination
   */
  async findCoupons(dto: QueryGostatusCouponsDto) {
    const filter: Record<string, any> = { isActive: true };

    if (dto.search && dto.search.trim()) {
      const regex = new RegExp(dto.search.trim(), 'i');
      filter.$or = [{ brand: regex }, { title: regex }, { description: regex }];
    }

    if (dto.brand && dto.brand.trim()) {
      filter.brand = new RegExp(dto.brand.trim(), 'i');
    }

    if (dto.country && dto.country.trim()) {
      const c = dto.country.trim().toUpperCase();
      filter.$or = filter.$or || [];
      filter.country = { $in: [c, null, ''] };
    }

    let sortOption: Record<string, 1 | -1> = { pos: 1, createdAt: -1 };
    if (dto.sort === 'coins_asc') {
      sortOption = { costCoins: 1 };
    } else if (dto.sort === 'coins_desc') {
      sortOption = { costCoins: -1 };
    }

    const page = Math.max(dto.page ?? 1, 1);
    const limit = Math.min(Math.max(dto.limit ?? 50, 1), 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.couponModel
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.couponModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a coupon by MongoDB ObjectId or numeric externalId
   */
  async getCouponById(idOrExternalId: string): Promise<GostatusCouponDocument> {
    let coupon: GostatusCouponDocument | null = null;

    if (Types.ObjectId.isValid(idOrExternalId)) {
      coupon = await this.couponModel.findById(idOrExternalId).exec();
    }

    if (!coupon && !isNaN(Number(idOrExternalId))) {
      coupon = await this.couponModel
        .findOne({ externalId: Number(idOrExternalId) })
        .exec();
    }

    if (!coupon) {
      throw new NotFoundException(
        `Gostatus coupon '${idOrExternalId}' not found in database`,
      );
    }

    return coupon;
  }

  /**
   * Redeem a Gostatus coupon using member's Reward Engine coin balance
   */
  async redeemCoupon(
    projectId: string,
    memberId: string,
    couponIdOrExternalId: string,
  ) {
    const coupon = await this.getCouponById(couponIdOrExternalId);

    if (!coupon.isActive) {
      throw new BadRequestException('coupon_unavailable: This coupon is no longer active');
    }

    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      throw new BadRequestException('coupon_unavailable: This coupon has expired');
    }

    if (coupon.stock !== null && coupon.stock === 0) {
      throw new BadRequestException('out_of_stock: Sorry, this coupon just ran out');
    }

    // Check per-user limit
    const existingCount = await this.redemptionModel
      .countDocuments({
        projectId: new Types.ObjectId(projectId),
        memberId: new Types.ObjectId(memberId),
        externalCouponId: coupon.externalId,
      })
      .exec();

    if (coupon.perUserLimit > 0 && existingCount >= coupon.perUserLimit) {
      throw new BadRequestException(
        'limit_reached: You have already redeemed this coupon',
      );
    }

    // 1. Debit coins from member wallet in this project
    const updatedMember = await this.membersService.debitCoins(
      projectId,
      memberId,
      coupon.costCoins,
      CoinTransactionType.GIFT_CARD_REDEEM,
      `Redeemed coupon: ${coupon.brand} - ${coupon.title}`,
      { gostatusCouponId: coupon.externalId },
    );

    // 2. Decrement stock if finite
    if (coupon.stock && coupon.stock > 0) {
      coupon.stock -= 1;
      await coupon.save();
    }

    // 3. Unlock code: if coupon has a pre-set code or extract from title, or generate clean voucher
    let unlockedCode = coupon.code;
    if (!unlockedCode) {
      // If title had a promo code before dash e.g. "CROOKED15 — 15% off"
      const match = coupon.title.match(/^([A-Z0-9_-]{4,20})\s*—/);
      if (match && !match[1].includes('•')) {
        unlockedCode = match[1];
      } else {
        const brandCode = coupon.brand
          .replace(/[^A-Za-z0-9]/g, '')
          .toUpperCase()
          .slice(0, 4);
        unlockedCode = `${brandCode}${coupon.externalId.toString().slice(-4)}`;
      }
    }

    // 4. Save redemption record
    const redemption = new this.redemptionModel({
      projectId: new Types.ObjectId(projectId),
      memberId: new Types.ObjectId(memberId),
      couponId: coupon._id,
      externalCouponId: coupon.externalId,
      brand: coupon.brand,
      title: coupon.title.replace('••••', unlockedCode),
      code: unlockedCode,
      costCoins: coupon.costCoins,
      redeemUrl: coupon.redeemUrl,
      assignedAt: new Date(),
    });

    await redemption.save();

    return {
      code: unlockedCode,
      title: redemption.title,
      brand: coupon.brand,
      redeemUrl: coupon.redeemUrl,
      expiresAt: coupon.expiresAt,
      assignedAt: redemption.assignedAt,
      balance: updatedMember.coinBalance,
    };
  }

  /**
   * List all Gostatus coupon redemptions for a specific member
   */
  async getMemberRedemptions(projectId: string, memberId: string) {
    return this.redemptionModel
      .find({
        projectId: new Types.ObjectId(projectId),
        memberId: new Types.ObjectId(memberId),
      })
      .sort({ assignedAt: -1 })
      .exec();
  }
}
