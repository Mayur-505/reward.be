import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ _id: false })
export class ProjectSettings {
  @Prop({ default: 50 })
  referralRewardCoins: number;

  @Prop({ default: 25 })
  refereeRewardCoins: number;

  @Prop({ default: 10 })
  welcomeCoins: number;

  @Prop({ default: 'Coins' })
  currencyName: string;

  @Prop({ default: 168 })
  referralClaimWindowHours: number;

  @Prop({ default: null })
  maxReferralsPerMember?: number;
}

export const ProjectSettingsSchema =
  SchemaFactory.createForClass(ProjectSettings);

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, unique: true, index: true })
  apiKey: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: ProjectSettingsSchema, default: () => ({}) })
  settings: ProjectSettings;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
