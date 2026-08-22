import { Query, Resolver, CONTEXT } from '@nestjs/graphql';
import { Inject, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/jwt-gql-auth.guard';
import { UserContext } from '../auth/authenticated-user';
import { SupportService } from './support.service';

@Resolver()
@UseGuards(GqlAuthGuard)
export class SupportResolver {
  constructor(
    @Inject(CONTEXT) private readonly context: UserContext,
    private readonly supportService: SupportService,
  ) {}

  @Query(() => String, {
    nullable: true,
    description: 'Get HMAC hash for Chatwoot identity verification',
  })
  async chatwootIdentifierHash(): Promise<string | null> {
    return this.supportService.getChatwootIdentifierHash(
      this.context.req.user.id.toString(),
    );
  }
}
