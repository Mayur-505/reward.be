import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import {
  GostatusCoupon,
  GostatusCouponDocument,
} from '../schemas/gostatus-coupon.schema';
import { GostatusClientService, RawGostatusCoupon } from './gostatus-client.service';

export interface SyncResult {
  success: boolean;
  totalFetched: number;
  upsertedCount: number;
  matchedCount: number;
  modifiedCount: number;
  durationMs: number;
  message: string;
}

@Injectable()
export class GostatusSyncService {
  private readonly logger = new Logger(GostatusSyncService.name);
  private isSyncing = false;

  constructor(
    @InjectModel(GostatusCoupon.name)
    private readonly couponModel: Model<GostatusCouponDocument>,
    private readonly clientService: GostatusClientService,
  ) {}

  /**
   * Daily Cron Job running at 03:00 UTC (Feedico imports daily at 02:30 UTC)
   */
  @Cron('0 3 * * *')
  async handleDailyCronSync() {
    this.logger.log('⏰ Starting scheduled daily sync of Gostatus / Feedico coupons...');
    try {
      const result = await this.syncNow();
      this.logger.log(`✅ Daily sync completed: ${result.message}`);
    } catch (err: any) {
      this.logger.error(`❌ Daily sync failed: ${err.message}`, err.stack);
    }
  }

  /**
   * Execute immediate full sync from Gostatus Supabase API into MongoDB
   */
  async syncNow(country?: string, maxPages: number = 50): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        totalFetched: 0,
        upsertedCount: 0,
        matchedCount: 0,
        modifiedCount: 0,
        durationMs: 0,
        message: 'Sync is already currently in progress',
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    let totalFetched = 0;
    let upsertedCount = 0;
    let matchedCount = 0;
    let modifiedCount = 0;

    try {
      const pageSize = 100;
      let offset = 0;
      let hasMore = true;
      let pageNum = 0;

      while (hasMore && pageNum < maxPages) {
        pageNum++;
        this.logger.log(
          `Fetching Gostatus coupons batch: offset=${offset}, limit=${pageSize}...`,
        );

        const batch = await this.clientService.listCoupons({
          p_country: country,
          p_limit: pageSize,
          p_offset: offset,
        });

        if (!batch || batch.length === 0) {
          hasMore = false;
          break;
        }

        totalFetched += batch.length;

        // Prepare bulk operations for atomic upsert
        const bulkOps = batch.map((raw: RawGostatusCoupon) => {
          const expiresAt = raw.expires_at ? new Date(raw.expires_at) : null;
          // Clean title if masked code can be extracted or preserved
          return {
            updateOne: {
              filter: { externalId: raw.id },
              update: {
                $set: {
                  externalId: raw.id,
                  brand: raw.brand || 'Featured Brand',
                  title: raw.title || '',
                  description: raw.description || '',
                  terms: raw.terms || '',
                  imageUrl: raw.image_url || '',
                  costCoins: raw.cost_coins ?? 0,
                  perUserLimit: raw.per_user_limit ?? 1,
                  expiresAt,
                  stock: raw.stock,
                  pos: raw.pos ?? 0,
                  isActive: true,
                  lastSyncedAt: new Date(),
                },
              },
              upsert: true,
            },
          };
        });

        const bulkRes = await this.couponModel.bulkWrite(bulkOps as any);
        upsertedCount += bulkRes.upsertedCount ?? 0;
        matchedCount += bulkRes.matchedCount ?? 0;
        modifiedCount += bulkRes.modifiedCount ?? 0;

        offset += batch.length;
        if (batch.length < pageSize) {
          hasMore = false;
        }
      }

      const durationMs = Date.now() - startTime;
      const message = `Synced ${totalFetched} coupons (${upsertedCount} new, ${modifiedCount} updated) in ${(
        durationMs / 1000
      ).toFixed(2)}s`;

      return {
        success: true,
        totalFetched,
        upsertedCount,
        matchedCount,
        modifiedCount,
        durationMs,
        message,
      };
    } finally {
      this.isSyncing = false;
    }
  }
}
