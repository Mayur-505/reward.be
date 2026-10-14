import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RawGostatusCoupon {
  id: number;
  brand: string;
  title: string;
  description: string | null;
  terms: string | null;
  image_url: string | null;
  cost_coins: number;
  per_user_limit: number;
  expires_at: string | null;
  stock: number | null;
  redeemed_by_me: number;
  pos?: number;
}

@Injectable()
export class GostatusClientService {
  private readonly logger = new Logger(GostatusClientService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl =
      configService.get<string>('app.gostatus.apiUrl') ??
      process.env.GOSTATUS_API_URL ??
      'https://agshntasrewovnrssmmp.supabase.co';

    this.apiKey =
      configService.get<string>('app.gostatus.apiKey') ??
      process.env.GOSTATUS_API_KEY ??
      'sb_publishable_R_aiP-ACZrUJzSaPacU6EA_dtCQBrCq';
  }

  /**
   * Ensures a valid anonymous Supabase session is available
   */
  async getValidToken(): Promise<string> {
    const now = Date.now();
    // Refresh 5 minutes before expiration
    if (this.accessToken && this.tokenExpiresAt > now + 300_000) {
      return this.accessToken;
    }

    if (this.refreshToken) {
      try {
        await this.refreshSession();
        if (this.accessToken) return this.accessToken;
      } catch (err: any) {
        this.logger.warn(`Failed to refresh token: ${err.message}. Signing up again.`);
      }
    }

    await this.signUpAnonymous();
    return this.accessToken!;
  }

  private async signUpAnonymous(): Promise<void> {
    this.logger.log('Authenticating anonymous session with Gostatus Supabase...');
    const res = await fetch(`${this.apiUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        apikey: this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(
        `Gostatus signup failed (HTTP ${res.status}): ${errBody}`,
      );
    }

    const data = await res.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    // expires_in is in seconds
    const expiresInMs = (data.expires_in ?? 3600) * 1000;
    this.tokenExpiresAt = Date.now() + expiresInMs;

    // Ensure profile exists for the anonymous user
    try {
      await this.ensureProfile();
    } catch (err: any) {
      this.logger.warn(`Could not ensure profile: ${err.message}`);
    }
  }

  private async refreshSession(): Promise<void> {
    const res = await fetch(
      `${this.apiUrl}/auth/v1/token?grant_type=refresh_token`,
      {
        method: 'POST',
        headers: {
          apikey: this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      },
    );

    if (!res.ok) {
      throw new Error(`Token refresh failed (HTTP ${res.status})`);
    }

    const data = await res.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token ?? this.refreshToken;
    const expiresInMs = (data.expires_in ?? 3600) * 1000;
    this.tokenExpiresAt = Date.now() + expiresInMs;
  }

  private async ensureProfile(): Promise<void> {
    if (!this.accessToken) return;
    await fetch(`${this.apiUrl}/rest/v1/rpc/ensure_profile`, {
      method: 'POST',
      headers: {
        apikey: this.apiKey,
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_device_id: 'nest-reward-backend' }),
    });
  }

  /**
   * Fetch a page of coupons from Gostatus Supabase API
   */
  async listCoupons(params: {
    p_country?: string;
    p_search?: string;
    p_limit?: number;
    p_offset?: number;
  }): Promise<RawGostatusCoupon[]> {
    const token = await this.getValidToken();

    const body: Record<string, any> = {
      p_limit: params.p_limit ?? 100,
      p_offset: params.p_offset ?? 0,
    };
    if (params.p_country) body.p_country = params.p_country;
    if (params.p_search) body.p_search = params.p_search;

    const res = await fetch(`${this.apiUrl}/rest/v1/rpc/list_coupons`, {
      method: 'POST',
      headers: {
        apikey: this.apiKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `Failed to fetch coupons from Gostatus (HTTP ${res.status}): ${errText}`,
      );
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }
}
