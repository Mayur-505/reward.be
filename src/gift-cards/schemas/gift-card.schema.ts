import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type GiftCardDocument = HydratedDocument<GiftCard>;

@Schema({ timestamps: true })
export class GiftCard {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({ required: true, min: 1 })
  coinCost: number;

  @Prop({ default: '' })
  imageUrl: string;

  @Prop({ default: -1 }) // -1 indicates unlimited stock
  stock: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const GiftCardSchema = SchemaFactory.createForClass(GiftCard);

GiftCardSchema.index({ projectId: 1, isActive: 1, coinCost: 1 });
