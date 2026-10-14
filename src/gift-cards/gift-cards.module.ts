import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembersModule } from '../members/members.module';
import { ProjectsModule } from '../projects/projects.module';
import { GiftCardsController } from './gift-cards.controller';
import { GiftCardsService } from './gift-cards.service';
import {
  GiftCardRedemption,
  GiftCardRedemptionSchema,
} from './schemas/gift-card-redemption.schema';
import { GiftCard, GiftCardSchema } from './schemas/gift-card.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GiftCard.name, schema: GiftCardSchema },
      { name: GiftCardRedemption.name, schema: GiftCardRedemptionSchema },
    ]),
    MembersModule,
    ProjectsModule,
  ],
  controllers: [GiftCardsController],
  providers: [GiftCardsService],
  exports: [GiftCardsService, MongooseModule],
})
export class GiftCardsModule {}
