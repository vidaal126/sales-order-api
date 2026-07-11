import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { FastifyRequest } from "fastify";

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const { headers, ip } = req as unknown as FastifyRequest;
    const forwarded = headers["x-forwarded-for"];
    const clientIp =
      typeof forwarded === "string" ? forwarded.split(",")[0].trim() : ip;
    return Promise.resolve(clientIp);
  }
}
