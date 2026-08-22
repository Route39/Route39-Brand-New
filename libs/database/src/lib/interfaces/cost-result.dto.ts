import { createUnionType, Field, ObjectType, Float } from '@nestjs/graphql';
import { PricingMode } from '../entities/taxi/enums/pricing-mode.enum';
import { RangePolicy } from '../entities/taxi/enums/range-policy.enum';

@ObjectType('FixedCost')
export class FixedCostDTO {
  @Field(() => Float)
  cost: number;

  @Field(() => PricingMode)
  mode: PricingMode;
}

@ObjectType('RangeCost')
export class RangeCostDTO {
  @Field(() => Float)
  cost: number;

  @Field(() => Float)
  min: number;

  @Field(() => Float)
  max: number;

  @Field(() => PricingMode)
  mode: PricingMode;

  @Field(() => RangePolicy)
  rangePolicy: RangePolicy;
}

export const CostResultUnion = createUnionType({
  name: 'CostResult',
  types: () => [FixedCostDTO, RangeCostDTO] as const,
  resolveType(value: { cost: number; min?: number; max?: number }) {
    if (value.min != null && value.max != null) {
      return RangeCostDTO;
    }
    return FixedCostDTO;
  },
});
