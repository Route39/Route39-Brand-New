import { Field, ObjectType } from '@nestjs/graphql';
import { RiderDTO } from './rider.dto';

@ObjectType()
export class UpdateProfileResponseDTO {
  @Field(() => RiderDTO)
  rider!: RiderDTO;

  @Field(() => Boolean)
  requiresEmailVerification!: boolean;

  @Field(() => String, { nullable: true })
  emailVerificationHash?: string;
}
