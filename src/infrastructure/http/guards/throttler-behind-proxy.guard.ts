import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const forwarded = req.headers as Record<string, string>;
    const ip = forwarded?.['x-forwarded-for'] ?? '';
    return Promise.resolve(ip);
  }
}
