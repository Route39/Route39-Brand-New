import { registerEnumType } from '@nestjs/graphql';

export enum PricingMode {
  FIXED = 'fixed',
  RANGE = 'range',
}

registerEnumType(PricingMode, { name: 'PricingMode' });
