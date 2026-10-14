import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MembersService } from '../members/members.service';
import { CoinTransactionType } from '../members/schemas/coin-transaction.schema';
import { ProjectsService } from '../projects/projects.service';
import { CreateCouponDto, RedeemCouponDto } from './dto/create-coupon.dto';
import {
  CouponRedemption,
  CouponRedemptionDocument,
} from './schemas/coupon-redemption.schema';
import { Coupon, CouponDocument } from './schemas/coupon.schema';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
    @InjectModel(CouponRedemption.name)
    private readonly redemptionModel: Model<CouponRedemptionDocument>,
    private readonly membersService: MembersService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(dto: CreateCouponDto): Promise<CouponDocument> {
    const cleanCode = dto.code.trim().toUpperCase();
    const existing = await this.couponModel.findOne({ code: cleanCode }).exec();

    if (existing) {
      throw new ConflictException(
        `Universal coupon '${cleanCode}' already exists`,
      );
    }

    const coupon = new this.couponModel({
      code: cleanCode,
      rewardCoins: dto.rewardCoins,
      maxGlobalUses: dto.maxGlobalUses ?? -1,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      description: dto.description ?? '',
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return coupon.save();
  }

  async findAll(): Promise<CouponDocument[]> {
    return this.couponModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByCode(code: string): Promise<CouponDocument> {
    const cleanCode = code.trim().toUpperCase();
    const coupon = await this.couponModel.findOne({ code: cleanCode }).exec();

    if (!coupon) {
      throw new NotFoundException(`Coupon '${cleanCode}' not found`);
    }

    return coupon;
  }

  async redeemCoupon(projectId: string, dto: RedeemCouponDto) {
    // 1. Verify project exists
    const project = await this.projectsService.findById(projectId);

    // 2. Verify member exists in project
    const member = await this.membersService.getMemberById(projectId, dto.memberId);

    // 3. Find and validate universal coupon
    const cleanCode = dto.couponCode.trim().toUpperCase();
    const coupon = await this.findByCode(cleanCode);

    if (!coupon.isActive) {
      throw new BadRequestException('This coupon is no longer active');
    }

    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      throw new BadRequestException('This coupon has expired');
    }

    if (
      coupon.maxGlobalUses > 0 &&
      coupon.currentUses >= coupon.maxGlobalUses
    ) {
      throw new BadRequestException(
        'This coupon has reached its maximum global usage limit',
      );
    }

    // 4. Check if member in this project has already redeemed it
    const existingRedemption = await this.redemptionModel
      .findOne({
        couponId: coupon._id,
        projectId: project._id,
        memberId: member._id,
      })
      .exec();

    if (existingRedemption) {
      throw new ConflictException(
        `Coupon '${cleanCode}' has already been redeemed by this member in this project`,
      );
    }

    // 5. Credit coins to the member's project wallet
    const updatedMember = await this.membersService.creditCoins(
      projectId,
      dto.memberId,
      coupon.rewardCoins,
      CoinTransactionType.COUPON_REDEEM,
      `Redeemed universal coupon: ${cleanCode}`,
      { couponId: coupon._id, couponCode: cleanCode },
    );

    // 6. Update global coupon usage count
    coupon.currentUses += 1;
    await coupon.save();

    // 7. Save redemption record
    const redemption = new this.redemptionModel({
      couponId: coupon._id,
      couponCode: cleanCode,
      projectId: project._id,
      memberId: member._id,
      coinsAwarded: coupon.rewardCoins,
    });
    await redemption.save();

    return {
      success: true,
      message: `Successfully redeemed coupon '${cleanCode}' for ${coupon.rewardCoins} coins!`,
      couponCode: cleanCode,
      coinsAwarded: coupon.rewardCoins,
      newBalance: updatedMember.coinBalance,
      memberId: dto.memberId,
      projectId: project._id.toString(),
      projectCode: project.code,
    };
  }

  async listRedemptionsForProject(
    projectId: string,
  ): Promise<CouponRedemptionDocument[]> {
    const project = await this.projectsService.findById(projectId);
    return this.redemptionModel
      .find({ projectId: project._id })
      .populate('memberId', 'externalUserId name email')
      .sort({ createdAt: -1 })
      .exec();
  }
}
