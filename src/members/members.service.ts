import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { ProjectDocument } from '../projects/schemas/project.schema';
import { ProjectsService } from '../projects/projects.service';
import {
  Referral,
  ReferralDocument,
} from '../referrals/schemas/referral.schema';
import { JwtService } from '@nestjs/jwt';
import { AdjustCoinsDto, RegisterMemberDto } from './dto/register-member.dto';
import { MemberLoginDto } from './dto/member-login.dto';
import {
  CoinTransaction,
  CoinTransactionDocument,
  CoinTransactionType,
} from './schemas/coin-transaction.schema';
import {
  ProjectMember,
  ProjectMemberDocument,
} from './schemas/project-member.schema';

@Injectable()
export class MembersService {
  constructor(
    @InjectModel(ProjectMember.name)
    private readonly memberModel: Model<ProjectMemberDocument>,
    @InjectModel(CoinTransaction.name)
    private readonly transactionModel: Model<CoinTransactionDocument>,
    @InjectModel(Referral.name)
    private readonly referralModel: Model<ReferralDocument>,
    private readonly projectsService: ProjectsService,
    private readonly jwtService: JwtService,
  ) {}

  async loginMember(
    projectId: string,
    dto: MemberLoginDto,
  ): Promise<{ accessToken: string; member: ProjectMemberDocument }> {
    const member = await this.registerOrFindMember(projectId, {
      externalUserId: dto.externalUserId,
      name: dto.name,
      email: dto.email,
      referralCode: dto.referralCode,
    });

    const project = await this.projectsService.findById(projectId);

    const payload = {
      sub: (member._id as any).toString(),
      type: 'MEMBER',
      memberId: (member._id as any).toString(),
      projectId: (project._id as any).toString(),
      projectCode: project.code,
      externalUserId: member.externalUserId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      member,
    };
  }

  async registerOrFindMember(
    projectId: string,
    dto: RegisterMemberDto,
  ): Promise<ProjectMemberDocument> {
    const project = await this.projectsService.findById(projectId);

    // 1. Check if member already exists in this project
    const existing = await this.memberModel
      .findOne({
        projectId: project._id,
        externalUserId: dto.externalUserId,
      })
      .exec();

    if (existing) {
      return existing;
    }

    // 2. Generate unique referral code for this member in this project
    const referralCode = await this.generateUniqueReferralCode(
      project._id,
      project.code,
    );

    // 3. Process referral if provided
    let referrerMember: ProjectMemberDocument | null = null;
    const cleanReferralCode = dto.referralCode?.trim().toUpperCase();

    if (cleanReferralCode) {
      referrerMember = await this.memberModel
        .findOne({
          projectId: project._id,
          referralCode: cleanReferralCode,
        })
        .exec();
    }

    const welcomeBonus = project.settings?.welcomeCoins ?? 10;

    // 4. Create new member
    const newMember = new this.memberModel({
      projectId: project._id,
      externalUserId: dto.externalUserId,
      name: dto.name ?? '',
      email: dto.email ?? '',
      coinBalance: welcomeBonus,
      totalEarnedCoins: welcomeBonus,
      totalSpentCoins: 0,
      referralCode,
      referredBy: referrerMember ? cleanReferralCode : null,
    });

    const savedMember = await newMember.save();

    // 5. Record Welcome Transaction
    if (welcomeBonus > 0) {
      await this.recordTransaction(
        project._id,
        savedMember._id,
        welcomeBonus,
        welcomeBonus,
        CoinTransactionType.WELCOME_BONUS,
        'Welcome bonus on registration',
      );
    }

    // 6. Record Referee & Referrer Rewards via shared helper
    if (referrerMember) {
      const rewardResult = await this.executeReferralReward(
        project,
        savedMember,
        referrerMember,
        cleanReferralCode,
      );
      return rewardResult.updatedReferee;
    }

    return savedMember;
  }

  /**
   * Shared referral reward crediting logic used by both initial login/registration
   * and POST /api/me/referral.
   *
   * Updates coin balances, records ledger transactions, and creates the Referral document.
   */
  async executeReferralReward(
    project: ProjectDocument,
    refereeMember: ProjectMemberDocument,
    referrerMember: ProjectMemberDocument,
    cleanReferralCode: string,
  ): Promise<{
    updatedReferee: ProjectMemberDocument;
    refereeCoinsAwarded: number;
    referrerCoinsAwarded: number;
  }> {
    const refereeBonus = project.settings?.refereeRewardCoins ?? 25;

    // Rule 5: Check if referrer reached maxReferralsPerMember
    let referrerBonus = project.settings?.referralRewardCoins ?? 50;
    const maxReferrals = project.settings?.maxReferralsPerMember;
    if (maxReferrals != null && maxReferrals > 0) {
      const completedCount = await this.referralModel.countDocuments({
        projectId: project._id,
        referrerMemberId: referrerMember._id,
        status: 'COMPLETED',
      });
      if (completedCount >= maxReferrals) {
        referrerBonus = 0; // Skip referrer reward
      }
    }

    // 1. Credit Referrer (if eligible)
    if (referrerBonus > 0) {
      await this.creditCoins(
        (project._id as any).toString(),
        (referrerMember._id as any).toString(),
        referrerBonus,
        CoinTransactionType.REFERRAL_CREDIT,
        `Referral bonus for inviting ${refereeMember.name || refereeMember.externalUserId}`,
        { refereeMemberId: refereeMember._id },
      );
    }

    // 2. Credit Referee
    let updatedReferee = refereeMember;
    if (refereeBonus > 0) {
      updatedReferee = await this.creditCoins(
        (project._id as any).toString(),
        (refereeMember._id as any).toString(),
        refereeBonus,
        CoinTransactionType.REFEREE_BONUS,
        `Bonus for joining with referral code ${cleanReferralCode}`,
        { referrerMemberId: referrerMember._id },
      );
    }

    // 3. Record in Referral collection
    await new this.referralModel({
      projectId: project._id,
      referrerMemberId: referrerMember._id,
      refereeMemberId: refereeMember._id,
      referralCode: cleanReferralCode,
      referrerCoinsAwarded: referrerBonus,
      refereeCoinsAwarded: refereeBonus,
      status: 'COMPLETED',
    }).save();

    return {
      updatedReferee,
      refereeCoinsAwarded: refereeBonus,
      referrerCoinsAwarded: referrerBonus,
    };
  }

  /**
   * Claim a referral code later for an existing member (POST /api/me/referral).
   * Validates all business rules in exact order and prevents double-claim via atomic findOneAndUpdate.
   */
  async claimReferralCode(
    projectId: string,
    memberId: string,
    referralCode: string,
  ): Promise<{
    member: ProjectMemberDocument;
    refereeCoinsAwarded: number;
    referrerCoinsAwarded: number;
  }> {
    const cleanCode = referralCode?.trim().toUpperCase();
    if (!cleanCode) {
      throw new BadRequestException('Referral code is required');
    }

    const project = await this.projectsService.findById(projectId);
    const member = await this.getMemberById(projectId, memberId);

    // Rule 1: Member already has referredBy → 409 { message: "Referral code already used" }
    if (member.referredBy) {
      throw new ConflictException('Referral code already used');
    }

    // Rule 2: Code not found in this member's project → 404 { message: "Invalid referral code" }
    const referrerMember = await this.memberModel
      .findOne({
        projectId: project._id,
        referralCode: cleanCode,
      })
      .exec();

    if (!referrerMember) {
      throw new NotFoundException('Invalid referral code');
    }

    // Rule 3: Code belongs to the member itself → 400 { message: "You cannot use your own code" }
    if (referrerMember._id.toString() === member._id.toString()) {
      throw new BadRequestException('You cannot use your own code');
    }

    // Rule 4: Member is too old: now - member.createdAt > project.settings.referralClaimWindowHours (default 168 = 7 days) → 403 { message: "Referral window has expired" }
    const windowHours = project.settings?.referralClaimWindowHours ?? 168;
    const createdAtTime = member.createdAt
      ? new Date(member.createdAt).getTime()
      : (member._id as any).getTimestamp
        ? (member._id as any).getTimestamp().getTime()
        : Date.now();
    const ageHours = (Date.now() - createdAtTime) / (1000 * 60 * 60);

    if (ageHours > windowHours) {
      throw new ForbiddenException('Referral window has expired');
    }

    // Rule 6: Prevent loops: if the referrer's referredBy is this member's code → 400
    if (
      referrerMember.referredBy &&
      referrerMember.referredBy.trim().toUpperCase() ===
        member.referralCode.trim().toUpperCase()
    ) {
      throw new BadRequestException(
        'Referral loop detected: referrer was referred by you',
      );
    }

    // Concurrency / Integrity:
    // Conditional update: findOneAndUpdate({ _id, referredBy: null }, { $set: { referredBy: code } })
    // Bail with 409 if it matched nothing, so double-taps can never pay twice.
    const updatedReferee = await this.memberModel
      .findOneAndUpdate(
        {
          _id: member._id,
          $or: [
            { referredBy: null },
            { referredBy: '' },
            { referredBy: { $exists: false } },
          ],
        },
        {
          $set: { referredBy: cleanCode },
        },
        { new: true },
      )
      .exec();

    if (!updatedReferee) {
      throw new ConflictException('Referral code already used');
    }

    try {
      // Execute shared referral reward (Rule 5 maxReferralsPerMember handled inside)
      const rewardResult = await this.executeReferralReward(
        project,
        updatedReferee,
        referrerMember,
        cleanCode,
      );

      return {
        member: rewardResult.updatedReferee,
        refereeCoinsAwarded: rewardResult.refereeCoinsAwarded,
        referrerCoinsAwarded: rewardResult.referrerCoinsAwarded,
      };
    } catch (err: any) {
      if (err.code === 11000) {
        throw new ConflictException('Referral code already used');
      }
      throw err;
    }
  }

  async getMemberById(
    projectId: string,
    memberId: string,
  ): Promise<ProjectMemberDocument> {
    const project = await this.projectsService.findById(projectId);
    const member = await this.memberModel
      .findOne({
        _id: new Types.ObjectId(memberId),
        projectId: project._id,
      })
      .exec();

    if (!member) {
      throw new NotFoundException(
        `Member '${memberId}' not found in project '${projectId}'`,
      );
    }

    return member;
  }

  async getMemberByExternalId(
    projectId: string,
    externalUserId: string,
  ): Promise<ProjectMemberDocument> {
    const project = await this.projectsService.findById(projectId);
    const member = await this.memberModel
      .findOne({
        projectId: project._id,
        externalUserId,
      })
      .exec();

    if (!member) {
      throw new NotFoundException(
        `Member with external user ID '${externalUserId}' not found in project`,
      );
    }

    return member;
  }

  async listMembers(projectId: string): Promise<ProjectMemberDocument[]> {
    const project = await this.projectsService.findById(projectId);
    return this.memberModel
      .find({ projectId: project._id })
      .sort({ createdAt: -1 })
      .exec();
  }

  async creditCoins(
    projectId: string,
    memberId: string,
    amount: number,
    type: string,
    description: string,
    metadata: Record<string, any> = {},
  ): Promise<ProjectMemberDocument> {
    if (amount <= 0) {
      throw new BadRequestException('Credit amount must be greater than 0');
    }

    const member = await this.getMemberById(projectId, memberId);
    member.coinBalance += amount;
    member.totalEarnedCoins += amount;
    const updatedMember = await member.save();

    await this.recordTransaction(
      member.projectId as unknown as Types.ObjectId,
      member._id as unknown as Types.ObjectId,
      amount,
      updatedMember.coinBalance,
      type,
      description,
      metadata,
    );

    return updatedMember;
  }

  async debitCoins(
    projectId: string,
    memberId: string,
    amount: number,
    type: string,
    description: string,
    metadata: Record<string, any> = {},
  ): Promise<ProjectMemberDocument> {
    if (amount <= 0) {
      throw new BadRequestException('Debit amount must be greater than 0');
    }

    const member = await this.getMemberById(projectId, memberId);

    if (member.coinBalance < amount) {
      throw new BadRequestException(
        `Insufficient coin balance. Current balance is ${member.coinBalance}, but ${amount} required.`,
      );
    }

    member.coinBalance -= amount;
    member.totalSpentCoins += amount;
    const updatedMember = await member.save();

    await this.recordTransaction(
      member.projectId as unknown as Types.ObjectId,
      member._id as unknown as Types.ObjectId,
      -amount,
      updatedMember.coinBalance,
      type,
      description,
      metadata,
    );

    return updatedMember;
  }

  async adjustCoins(
    projectId: string,
    memberId: string,
    dto: AdjustCoinsDto,
  ): Promise<ProjectMemberDocument> {
    if (dto.amount > 0) {
      return this.creditCoins(
        projectId,
        memberId,
        dto.amount,
        CoinTransactionType.ADMIN_ADJUSTMENT,
        dto.description,
      );
    } else if (dto.amount < 0) {
      return this.debitCoins(
        projectId,
        memberId,
        Math.abs(dto.amount),
        CoinTransactionType.ADMIN_ADJUSTMENT,
        dto.description,
      );
    }
    return this.getMemberById(projectId, memberId);
  }

  async getTransactionHistory(
    projectId: string,
    memberId: string,
  ): Promise<CoinTransactionDocument[]> {
    const member = await this.getMemberById(projectId, memberId);

    return this.transactionModel
      .find({
        projectId: member.projectId,
        memberId: member._id,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  private async recordTransaction(
    projectId: Types.ObjectId,
    memberId: Types.ObjectId,
    amount: number,
    balanceAfter: number,
    type: string,
    description: string,
    metadata: Record<string, any> = {},
  ): Promise<CoinTransactionDocument> {
    const tx = new this.transactionModel({
      projectId,
      memberId,
      amount,
      balanceAfter,
      type,
      description,
      metadata,
    });
    return tx.save();
  }

  private async generateUniqueReferralCode(
    projectId: Types.ObjectId,
    projectCode: string,
  ): Promise<string> {
    const prefix = projectCode.slice(0, 4).toUpperCase();
    for (let attempts = 0; attempts < 10; attempts++) {
      const randomSuffix = randomBytes(3).toString('hex').toUpperCase();
      const candidateCode = `${prefix}${randomSuffix}`;

      const exists = await this.memberModel
        .findOne({ projectId, referralCode: candidateCode })
        .exec();

      if (!exists) {
        return candidateCode;
      }
    }
    // Fallback timestamp code
    return `${prefix}${Date.now().toString(36).toUpperCase()}`;
  }
}
