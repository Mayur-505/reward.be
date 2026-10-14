import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ReferralDocument = HydratedDocument<Referral>;

@Schema({ timestamps: true })
export class Referral {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProjectMember', required: true, index: true })
  referrerMemberId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProjectMember', required: true })
  refereeMemberId: Types.ObjectId;

  @Prop({ required: true, uppercase: true })
  referralCode: string;

  @Prop({ default: 0 })
  referrerCoinsAwarded: number;

  @Prop({ default: 0 })
  refereeCoinsAwarded: number;

  @Prop({ default: 'COMPLETED' })
  status: string;
}

export const ReferralSchema = SchemaFactory.createForClass(Referral);

// A referee can only be referred once in each project
ReferralSchema.index({ refereeMemberId: 1 }, { unique: true });
ReferralSchema.index({ projectId: 1, refereeMemberId: 1 }, { unique: true });
ReferralSchema.index({ projectId: 1, referrerMemberId: 1, createdAt: -1 });
