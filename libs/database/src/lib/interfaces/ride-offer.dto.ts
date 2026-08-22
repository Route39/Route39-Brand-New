import {
  Field,
  Float,
  GraphQLISODateTime,
  ID,
  Int,
  ObjectType,
} from '@nestjs/graphql';
import { ServiceOptionIcon, TaxiOrderType } from '../entities';
import { Point, WaypointBase } from '.';
import { PricingMode } from '../entities/taxi/enums/pricing-mode.enum';
import { RangePolicy } from '../entities/taxi/enums/range-policy.enum';

@ObjectType('RideOffer')
export class RideOfferDTO {
  @Field(() => ID)
  id: number;

  @Field(() => TaxiOrderType)
  type: TaxiOrderType;

  @Field(() => String)
  currency: string;

  @Field(() => [WaypointBase])
  waypoints: WaypointBase[];

  @Field(() => Int, {
    description: 'The total distance in meters for the order.',
  })
  distance: number;

  @Field(() => Float, {
    description: 'The minimum cost estimate for the order.',
    nullable: true,
  })
  costMin?: number;
  @Field(() => Float, {
    description: 'The maximum cost estimate for the order.',
    nullable: true,
  })
  costMax?: number;

  @Field(() => PricingMode, { nullable: false })
  pricingMode: PricingMode;

  @Field(() => RangePolicy, { nullable: true })
  rangePolicy?: RangePolicy;

  @Field(() => Int, {
    description: 'The total duration in seconds for the order',
  })
  duration: number;

  @Field(() => [Point], {
    description: 'The directions for the order from driver to passenger.',
  })
  directions: Point[];

  @Field(() => GraphQLISODateTime, { nullable: true })
  dispatchedToUserAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  expiresAt?: Date;

  @Field(() => Float)
  fareEstimate: number;

  @Field(() => String)
  serviceName: string;

  @Field(() => String)
  serviceImageAddress: string;

  @Field(() => [RideOptionDTO])
  options!: RideOptionDTO[];

  @Field(() => PassengerInformationDTO, { nullable: true })
  passenger!: PassengerInformationDTO;
}

@ObjectType('RideOption')
export class RideOptionDTO {
  @Field(() => String)
  name: string;

  @Field(() => ServiceOptionIcon)
  icon: ServiceOptionIcon;
}

@ObjectType('PassengerInformation')
export class PassengerInformationDTO {
  @Field(() => String, { nullable: true })
  firstName?: string;

  @Field(() => String, { nullable: true })
  lastName?: string;

  @Field(() => String, { nullable: true })
  profilePicture?: string;
}
