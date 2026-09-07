import { Injectable } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private client: Razorpay;

  constructor() {
    this.client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  async createOrder(amount: number, currency: string, receipt: string) {
    // amount in paise (INR smallest unit) — multiply rupees by 100
    return this.client.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt,
    });
  }

  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const generated = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return generated === signature;
  }
}
