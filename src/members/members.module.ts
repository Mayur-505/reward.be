import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { Referral, ReferralSchema } from '../referrals/schemas/referral.schema';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import {
  CoinTransaction,
  CoinTransactionSchema,
} from './schemas/coin-transaction.schema';
import {
  ProjectMember,
  ProjectMemberSchema,
} from './schemas/project-member.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProjectMember.name, schema: ProjectMemberSchema },
      { name: CoinTransaction.name, schema: CoinTransactionSchema },
      { name: Referral.name, schema: ReferralSchema },
    ]),
    ProjectsModule,
    AuthModule,
  ],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService, MongooseModule],
})
export class MembersModule {}
