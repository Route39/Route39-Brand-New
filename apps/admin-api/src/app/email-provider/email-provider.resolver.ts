import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { EmailProviderService } from './email-provider.service';
import { EmailProviderDTO } from './dto/email-provider.dto';

@Resolver()
export class EmailProviderResolver {
  constructor(private emailProviderService: EmailProviderService) {}

  @Mutation(() => EmailProviderDTO)
  async markEmailProviderAsDefault(
    @Args('id', { type: () => ID }) id: number,
  ): Promise<EmailProviderDTO> {
    return await this.emailProviderService.markAsDefault(id);
  }
}
