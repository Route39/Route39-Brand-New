import { ObjectType, Field } from '@nestjs/graphql';
import { RiderDTO } from '../../rider/dto/rider.dto';

@ObjectType('VerifcationResult')
export class VerificationDto {
  @Field(() => String, { nullable: false })
  jwtToken!: string;
  @Field(() => String, { nullable: false })
  refreshToken!: string;
  @Field(() => RiderDTO, { nullable: false })
  user!: RiderDTO;
  @Field(() => Boolean, { nullable: false })
  hasPassword!: boolean;
  @Field(() => Boolean, { nullable: false })
  hasName!: boolean;
}
