import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MembersService } from '../members/members.service';
import { ProjectsService } from '../projects/projects.service';
import { Referral, ReferralDocument } from './schemas/referral.schema';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectModel(Referral.name)
    private readonly referralModel: Model<ReferralDocument>,
    private readonly membersService: MembersService,
    private readonly projectsService: ProjectsService,
  ) {}

  async getReferralStats(projectId: string, memberId: string) {
    const project = await this.projectsService.findById(projectId);
    const member = await this.membersService.getMemberById(projectId, memberId);

    const referrals = await this.referralModel
      .find({
        projectId: project._id,
        referrerMemberId: member._id,
      })
      .populate('refereeMemberId', 'externalUserId name email createdAt')
      .sort({ createdAt: -1 })
      .exec();

    const totalCoinsEarned = referrals.reduce(
      (sum, ref) => sum + (ref.referrerCoinsAwarded || 0),
      0,
    );

    return {
      referralCode: member.referralCode,
      totalInvited: referrals.length,
      totalCoinsEarned,
      referrals,
    };
  }

  async listProjectReferrals(projectId: string): Promise<ReferralDocument[]> {
    const project = await this.projectsService.findById(projectId);
    return this.referralModel
      .find({ projectId: project._id })
      .populate('referrerMemberId', 'externalUserId name email referralCode')
      .populate('refereeMemberId', 'externalUserId name email')
      .sort({ createdAt: -1 })
      .exec();
  }
}
