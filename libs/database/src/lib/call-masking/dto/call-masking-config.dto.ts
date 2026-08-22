import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('CallMaskingConfig')
export class CallMaskingConfigDTO {
  @Field(() => Boolean)
  enabled!: boolean;

  @Field(() => String)
  maskingNumber!: string;
}
