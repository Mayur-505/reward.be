import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembersModule } from '../members/members.module';
import { ProjectsModule } from '../projects/projects.module';
import { GostatusCouponsController } from './gostatus-coupons.controller';
import { GostatusCouponsService } from './gostatus-coupons.service';
import {
  GostatusCoupon,
  GostatusCouponSchema,
} from './schemas/gostatus-coupon.schema';
import {
  GostatusCouponRedemption,
  GostatusCouponRedemptionSchema,
} from './schemas/gostatus-redemption.schema';
import { GostatusClientService } from './services/gostatus-client.service';
import { GostatusSyncService } from './services/gostatus-sync.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GostatusCoupon.name, schema: GostatusCouponSchema },
      {
        name: GostatusCouponRedemption.name,
        schema: GostatusCouponRedemptionSchema,
      },
    ]),
    MembersModule,
    ProjectsModule,
  ],
  controllers: [GostatusCouponsController],
  providers: [
    GostatusClientService,
    GostatusSyncService,
    GostatusCouponsService,
  ],
  exports: [GostatusCouponsService, GostatusSyncService, MongooseModule],
})
export class GostatusCouponsModule {}
