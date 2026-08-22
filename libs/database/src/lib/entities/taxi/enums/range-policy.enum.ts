import { registerEnumType } from '@nestjs/graphql';

export enum RangePolicy {
  ENFORCE = 'enforce',
  SOFT = 'soft',
  OPEN = 'open',
}

registerEnumType(RangePolicy, { name: 'RangePolicy' });
