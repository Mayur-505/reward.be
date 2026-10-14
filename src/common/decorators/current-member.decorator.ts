import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ProjectMemberDocument } from '../../members/schemas/project-member.schema';

export const CurrentMember = createParamDecorator(
  (data: keyof ProjectMemberDocument | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.isMember || !user.member) {
      throw new UnauthorizedException('Member authentication token required');
    }

    const member = user.member;
    return data ? member[data] : member;
  },
);
