import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GostatusCouponDocument = HydratedDocument<GostatusCoupon>;

@Schema({ timestamps: true })
export class GostatusCoupon {
  @Prop({ required: true, unique: true, index: true })
  externalId: number;

  @Prop({ required: true, index: true, trim: true })
  brand: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  terms: string;

  @Prop({ default: '' })
  imageUrl: string;

  @Prop({ required: true, min: 0, default: 0 })
  costCoins: number;

  @Prop({ default: 1 })
  perUserLimit: number;

  @Prop({ default: null })
  expiresAt?: Date;

  @Prop({ default: null })
  stock?: number; // null = unlimited (shared code); number = unique codes left

  @Prop({ default: null, index: true })
  country?: string;

  @Prop({ default: 0 })
  pos: number;

  @Prop({ default: '' })
  redeemUrl: string;

  @Prop({ default: null })
  code?: string;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: Date.now })
  lastSyncedAt: Date;
}

export const GostatusCouponSchema = SchemaFactory.createForClass(GostatusCoupon);

GostatusCouponSchema.index({ brand: 'text', title: 'text' });
GostatusCouponSchema.index({ isActive: 1, costCoins: 1 });
