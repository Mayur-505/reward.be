import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type CouponRedemptionDocument = HydratedDocument<CouponRedemption>;

@Schema({ timestamps: true })
export class CouponRedemption {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Coupon', required: true, index: true })
  couponId: Types.ObjectId;

  @Prop({ required: true, uppercase: true })
  couponCode: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProjectMember', required: true, index: true })
  memberId: Types.ObjectId;

  @Prop({ required: true })
  coinsAwarded: number;
}

export const CouponRedemptionSchema =
  SchemaFactory.createForClass(CouponRedemption);

// Ensures a member in a given project can redeem a universal coupon only once
CouponRedemptionSchema.index(
  { couponId: 1, projectId: 1, memberId: 1 },
  { unique: true },
);
CouponRedemptionSchema.index({ projectId: 1, memberId: 1, createdAt: -1 });
