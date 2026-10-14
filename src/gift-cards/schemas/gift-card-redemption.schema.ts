import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type GiftCardRedemptionDocument = HydratedDocument<GiftCardRedemption>;

export enum RedemptionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DELIVERED = 'DELIVERED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true })
export class GiftCardRedemption {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProjectMember', required: true, index: true })
  memberId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'GiftCard', required: true, index: true })
  giftCardId: Types.ObjectId;

  @Prop({ required: true })
  coinCost: number;

  @Prop({
    required: true,
    enum: Object.values(RedemptionStatus),
    default: RedemptionStatus.PENDING,
  })
  status: string;

  @Prop({ default: '', trim: true })
  voucherCode: string;

  @Prop({ default: '', trim: true })
  adminNote: string;

  @Prop({ default: null })
  processedAt?: Date;
}

export const GiftCardRedemptionSchema =
  SchemaFactory.createForClass(GiftCardRedemption);

GiftCardRedemptionSchema.index({ projectId: 1, memberId: 1, createdAt: -1 });
GiftCardRedemptionSchema.index({ projectId: 1, status: 1 });
