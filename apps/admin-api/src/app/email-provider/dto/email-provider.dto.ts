import { ID, ObjectType, Field } from '@nestjs/graphql';
import {
  Authorize,
  FilterableField,
  IDField,
  OffsetConnection,
} from '@ptc-org/nestjs-query-graphql';
import { EmailProviderType } from '@ridy/database';
import { EmailProviderAuthorizer } from '../email-provider.authorizer';
import { EmailDTO } from './email.dto';

@ObjectType('EmailProvider', {
  description: 'Email Provider',
})
@OffsetConnection('emails', () => EmailDTO, { enableAggregate: true })
@Authorize(EmailProviderAuthorizer)
export class EmailProviderDTO {
  @IDField(() => ID)
  id: number;

  @FilterableField()
  name!: string;

  @FilterableField(() => EmailProviderType)
  type!: EmailProviderType;

  @Field(() => Boolean, { nullable: false })
  isDefault!: boolean;

  @Field(() => String, { nullable: true })
  apiKey?: string;

  @Field(() => String, { nullable: true })
  fromEmail?: string;

  @Field(() => String, { nullable: true })
  fromName?: string;

  @Field(() => String, { nullable: true })
  replyToEmail?: string;
}
