import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { appConfig } from './config/app.config';
import { CouponsModule } from './coupons/coupons.module';
import { GiftCardsModule } from './gift-cards/gift-cards.module';
import { GostatusCouponsModule } from './gostatus-coupons/gostatus-coupons.module';
import { MeModule } from './me/me.module';
import { MembersModule } from './members/members.module';
import { ProjectsModule } from './projects/projects.module';
import { ReferralsModule } from './referrals/referrals.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('app.mongodb.uri') ??
          process.env.MONGO_URI ??
          'mongodb+srv://braincurahealth_db_user:gX4r3YWYnc17hrSQ@cluster0.ddiqba5.mongodb.net/reward_db?retryWrites=true&w=majority&appName=Cluster0',
      }),
    }),
    UsersModule,
    AuthModule,
    ProjectsModule,
    MembersModule,
    ReferralsModule,
    GiftCardsModule,
    CouponsModule,
    GostatusCouponsModule,
    MeModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
