import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../../users/users.service';
import {
  ProjectMember,
  ProjectMemberDocument,
} from '../../members/schemas/project-member.schema';

export interface JwtPayload {
  sub: string;
  email?: string;
  roles?: string[];
  type?: 'ADMIN' | 'MEMBER';
  memberId?: string;
  projectId?: string;
  projectCode?: string;
  externalUserId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @InjectModel(ProjectMember.name)
    private readonly memberModel: Model<ProjectMemberDocument>,
  ) {
    const jwtSecret =
      configService.get<string>('app.jwt.secret') ??
      process.env.JWT_SECRET ??
      'reward-be-jwt-super-secret-key-2026';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type === 'MEMBER' || payload.memberId) {
      const member = await this.memberModel.findById(payload.sub).exec();
      if (!member) {
        throw new UnauthorizedException('Member account not found or deactivated');
      }

      return {
        isMember: true,
        memberId: member._id.toString(),
        projectId: member.projectId.toString(),
        externalUserId: member.externalUserId,
        member,
      };
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found or token invalid');
    }
    return user;
  }
}
