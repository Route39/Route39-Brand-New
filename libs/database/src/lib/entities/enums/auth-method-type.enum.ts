import { registerEnumType } from '@nestjs/graphql';

export enum AuthMethodType {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
  PASSKEY = 'PASSKEY',
}

registerEnumType(AuthMethodType, {
  name: 'AuthMethodType',
  description: 'The type of authentication method',
});
