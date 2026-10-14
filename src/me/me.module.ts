import { Module } from '@nestjs/common';
import { CouponsModule } from '../coupons/coupons.module';
import { GiftCardsModule } from '../gift-cards/gift-cards.module';
import { MembersModule } from '../members/members.module';
import { ProjectsModule } from '../projects/projects.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { GostatusCouponsModule } from '../gostatus-coupons/gostatus-coupons.module';
import { MeController } from './me.controller';

@Module({
  imports: [
    MembersModule,
    ReferralsModule,
    GiftCardsModule,
    CouponsModule,
    ProjectsModule,
    GostatusCouponsModule,
  ],
  controllers: [MeController],
})
export class MeModule {}
