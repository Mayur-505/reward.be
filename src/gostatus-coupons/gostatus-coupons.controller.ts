import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { QueryGostatusCouponsDto } from './dto/query-gostatus-coupons.dto';
import { GostatusCouponsService } from './gostatus-coupons.service';
import { GostatusSyncService } from './services/gostatus-sync.service';

@ApiTags('External / Partner Coupons (Feedico & Gostatus)')
@Controller('api/gostatus-coupons')
export class GostatusCouponsController {
  constructor(
    private readonly couponsService: GostatusCouponsService,
    private readonly syncService: GostatusSyncService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List & Search Synced Gostatus / Feedico Coupons',
    description:
      'Browse all external coupons stored in the local database with brand search, country filters, and pagination.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of coupons' })
  async listCoupons(@Query() query: QueryGostatusCouponsDto) {
    return this.couponsService.findCoupons(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get Coupon Details by ID',
    description:
      'Retrieve a single synced coupon by its MongoDB ObjectId or external Feedico coupon ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId or numeric externalId (e.g. 64895)',
  })
  @ApiResponse({ status: 200, description: 'Coupon details' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async getCoupon(@Param('id') id: string) {
    return this.couponsService.getCouponById(id);
  }

  @ApiBearerAuth('JWT-Auth')
  @Post('sync')
  @ApiOperation({
    summary: 'Trigger Immediate Sync from Gostatus / Feedico Supabase API',
    description:
      'Fetches the latest coupons from Gostatus Supabase and bulk upserts them into MongoDB. (Also runs automatically every day at 03:00 UTC via Cron).',
  })
  @ApiQuery({
    name: 'country',
    required: false,
    description: 'Optional 2-letter country code filter (e.g. US, IN)',
  })
  @ApiQuery({
    name: 'maxPages',
    required: false,
    description: 'Max pages to fetch (100 coupons per page, default 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync execution result with totals and duration',
  })
  async triggerSync(
    @Query('country') country?: string,
    @Query('maxPages') maxPages?: number,
  ) {
    return this.syncService.syncNow(country, maxPages ? Number(maxPages) : 50);
  }
}
