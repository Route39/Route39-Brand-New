import { registerEnumType } from '@nestjs/graphql';

export enum UserType {
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
}

registerEnumType(UserType, {
  name: 'UserType',
  description: 'Type of user in the system',
});
