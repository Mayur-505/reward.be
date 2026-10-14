import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ProjectMemberDocument = HydratedDocument<ProjectMember>;

@Schema({ timestamps: true })
export class ProjectMember {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  externalUserId: string;

  @Prop({ default: '', trim: true })
  name: string;

  @Prop({ default: '', lowercase: true, trim: true })
  email: string;

  @Prop({ default: 0, min: 0 })
  coinBalance: number;

  @Prop({ default: 0, min: 0 })
  totalEarnedCoins: number;

  @Prop({ default: 0, min: 0 })
  totalSpentCoins: number;

  @Prop({ required: true, trim: true, uppercase: true })
  referralCode: string;

  @Prop({ default: null, trim: true, uppercase: true })
  referredBy?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);

// Ensure externalUserId and referralCode are unique strictly per project
ProjectMemberSchema.index({ projectId: 1, externalUserId: 1 }, { unique: true });
ProjectMemberSchema.index({ projectId: 1, referralCode: 1 }, { unique: true });
