import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembersModule } from '../members/members.module';
import { ProjectsModule } from '../projects/projects.module';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import {
  CouponRedemption,
  CouponRedemptionSchema,
} from './schemas/coupon-redemption.schema';
import { Coupon, CouponSchema } from './schemas/coupon.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Coupon.name, schema: CouponSchema },
      { name: CouponRedemption.name, schema: CouponRedemptionSchema },
    ]),
    MembersModule,
    ProjectsModule,
  ],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService, MongooseModule],
})
export class CouponsModule {}
