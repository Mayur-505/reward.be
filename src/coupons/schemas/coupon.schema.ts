import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CouponDocument = HydratedDocument<Coupon>;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, min: 1 })
  rewardCoins: number;

  @Prop({ default: -1 }) // -1 indicates unlimited global uses
  maxGlobalUses: number;

  @Prop({ default: 0 })
  currentUses: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  expiresAt?: Date;

  @Prop({ default: '' })
  description: string;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

CouponSchema.index({ code: 1, isActive: 1 });
