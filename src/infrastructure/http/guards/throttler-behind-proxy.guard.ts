import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const forwarded = req['headers'] as Record<string, string>;
    return (forwarded?.['x-forwarded-for'] as string) ?? (req['ip'] as string);
  }
}
