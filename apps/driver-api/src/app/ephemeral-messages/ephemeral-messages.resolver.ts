import { CONTEXT, Mutation, Query, Resolver, Args, ID } from '@nestjs/graphql';
import { EphemeralMessagesService } from './ephemeral-messages.service';
import { EphemeralMessageDTO } from './dtos/ephemeral-message.dto';
import { Inject, UseGuards } from '@nestjs/common';
import { UserContext } from '../auth/authenticated-user';
import { GqlAuthGuard } from '../auth/jwt-gql-auth.guard';

@Resolver()
@UseGuards(GqlAuthGuard)
export class EphemeralMessagesResolver {
  constructor(
    private readonly ephemeralMessagesService: EphemeralMessagesService,
    @Inject(CONTEXT) private context: UserContext,
  ) {}

  @Query(() => [EphemeralMessageDTO])
  async ephemeralMessages() {
    return this.ephemeralMessagesService.getEphemeralMessage(
      this.context.req.user.id,
    );
  }

  @Mutation(() => Boolean)
  async markEphemeralMessagesAsRead(
    @Args('messageId', { type: () => ID }) messageId: string,
  ) {
    return this.ephemeralMessagesService.markEphemeralMessagesAsRead(
      this.context.req.user.id,
      messageId,
    );
  }
}
