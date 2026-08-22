import { CallerType } from '../enums/caller-type.enum';

export interface CallRoutingResult {
  success: boolean;
  callerType?: CallerType;
  orderId?: number;
  targetNumber?: string;
  error?: string;
  message?: string;
  twiml: string;
}
