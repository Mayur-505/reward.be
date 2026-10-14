import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type CoinTransactionDocument = HydratedDocument<CoinTransaction>;

export enum CoinTransactionType {
  WELCOME_BONUS = 'WELCOME_BONUS',
  REFERRAL_CREDIT = 'REFERRAL_CREDIT',
  REFEREE_BONUS = 'REFEREE_BONUS',
  COUPON_REDEEM = 'COUPON_REDEEM',
  GIFT_CARD_REDEEM = 'GIFT_CARD_REDEEM',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
  DAILY_REWARD = 'DAILY_REWARD',
}

@Schema({ timestamps: true })
export class CoinTransaction {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProjectMember', required: true, index: true })
  memberId: Types.ObjectId;

  @Prop({ required: true })
  amount: number; // positive for credits, negative for debits

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({
    required: true,
    enum: Object.values(CoinTransactionType),
    default: CoinTransactionType.ADMIN_ADJUSTMENT,
  })
  type: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const CoinTransactionSchema = SchemaFactory.createForClass(CoinTransaction);

CoinTransactionSchema.index({ projectId: 1, memberId: 1, createdAt: -1 });
