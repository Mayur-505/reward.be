import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { lastValueFrom, Observable } from 'rxjs';
import { ProjectsService } from '../../projects/projects.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly projectsService: ProjectsService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey =
      (request.headers['x-api-key'] as string | undefined) ||
      (request.headers['x-project-key'] as string | undefined);

    if (apiKey) {
      const project = await this.projectsService.findByApiKey(apiKey);
      if (!project) {
        throw new UnauthorizedException('Invalid or inactive project API key');
      }

      // If route contains projectId param, verify project match
      const routeProjectId = request.params?.projectId;
      if (routeProjectId) {
        const isCurrentKeyword =
          routeProjectId.toLowerCase() === 'current' ||
          routeProjectId.toLowerCase() === 'me';

        if (isCurrentKeyword) {
          request.params.projectId = project._id.toString();
        } else {
          const idMatches =
            routeProjectId === project._id.toString() ||
            routeProjectId.toUpperCase() === project.code.toUpperCase();

          if (!idMatches) {
            throw new ForbiddenException(
              `API key does not have access to project '${routeProjectId}'`,
            );
          }
        }
      }

      request.project = project;
      request.user = {
        isApiKey: true,
        projectId: project._id,
        projectCode: project.code,
      };
      return true;
    }

    // No API key provided: fall back to JWT authentication
    const result = super.canActivate(context);
    if (result instanceof Observable) {
      return await lastValueFrom(result);
    }
    return (await result) as boolean;
  }
}
