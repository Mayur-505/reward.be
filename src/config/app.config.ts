import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongodb: {
    uri:
      process.env.MONGO_URI ??
      'mongodb+srv://braincurahealth_db_user:gX4r3YWYnc17hrSQ@cluster0.ddiqba5.mongodb.net/reward_db?retryWrites=true&w=majority&appName=Cluster0',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'reward-be-jwt-super-secret-key-2026',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  gostatus: {
    apiUrl:
      process.env.GOSTATUS_API_URL ?? 'https://agshntasrewovnrssmmp.supabase.co',
    apiKey:
      process.env.GOSTATUS_API_KEY ??
      'sb_publishable_R_aiP-ACZrUJzSaPacU6EA_dtCQBrCq',
    cronExpression: process.env.GOSTATUS_SYNC_CRON ?? '0 3 * * *',
  },
}));
