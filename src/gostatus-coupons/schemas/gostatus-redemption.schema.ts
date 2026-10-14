import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type GostatusCouponRedemptionDocument =
  HydratedDocument<GostatusCouponRedemption>;

@Schema({ timestamps: true })
export class GostatusCouponRedemption {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProjectMember', required: true, index: true })
  memberId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'GostatusCoupon', required: true, index: true })
  couponId: Types.ObjectId;

  @Prop({ required: true, index: true })
  externalCouponId: number;

  @Prop({ required: true })
  brand: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, min: 0 })
  costCoins: number;

  @Prop({ default: '' })
  redeemUrl: string;

  @Prop({ default: Date.now })
  assignedAt: Date;
}

export const GostatusCouponRedemptionSchema =
  SchemaFactory.createForClass(GostatusCouponRedemption);

GostatusCouponRedemptionSchema.index({ projectId: 1, memberId: 1, externalCouponId: 1 });
