export default () => ({
  port: parseInt(process.env.PORT || '9000', 10),
  node_env: process.env.NODE_ENV || 'development',

  security: {
    bcrypt_salt_rounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },

  jwt: {
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    /** HttpOnly cookie max-age; keep aligned with JWT_ACCESS_EXPIRES_IN (default 15m). */
    JWT_ACCESS_EXPIRES_MS: parseInt(
      process.env.JWT_ACCESS_EXPIRES_MS || '900000',
      10,
    ),

    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    /** Refresh cookie max-age; default 7d to match JWT_REFRESH_EXPIRES_IN. */
    JWT_REFRESH_EXPIRES_MS: parseInt(
      process.env.JWT_REFRESH_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000),
      10,
    ),
    REFRESH_TOKEN_TTL_DAYS: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '7', 10),

    JWT_ISSUER: process.env.JWT_ISSUER || 'willgus_auth_service',
    JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'willgus_web_client',
  },

  device: {
    MAX_DEVICES: parseInt(process.env.MAX_DEVICES || '3', 10),
    RACE_CONDITION_GRACE_MS: process.env.RACE_CONDITION_GRACE_MS
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    /** Prefer REDIS_URL; REDIS_CONNECTION_URL kept for docker-compose / legacy .env parity */
    url: process.env.REDIS_URL || process.env.REDIS_CONNECTION_URL,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    tls: process.env.REDIS_TLS,
    /** When using TLS (rediss:// or REDIS_TLS=true), set to "false" only for dev / private CAs. */
    tlsRejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED,
    prefix: process.env.REDIS_PREFIX || 'myapp',
    cluster: process.env.REDIS_CLUSTER === 'true',
    clusterNodes: process.env.REDIS_CLUSTER_NODES || '',
    sentinelHost: process.env.REDIS_SENTINEL_HOST,
    sentinelPort: parseInt(process.env.REDIS_SENTINEL_PORT || '26379', 10),
    sentinelMaster: process.env.REDIS_SENTINEL_MASTER || 'mymaster',
    localCacheMax: parseInt(process.env.REDIS_LOCAL_CACHE_MAX || '1000', 10),
    localCacheTtlMs: parseInt(process.env.REDIS_LOCAL_CACHE_TTL_MS || '5000', 10),
    connectTimeoutMs: parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS || '10000', 10),
    lockAcquireMaxWaitMs: parseInt(
      process.env.REDIS_LOCK_ACQUIRE_MAX_WAIT_MS || '2000',
      10,
    ),
  },

  oauth: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  },

  auth: {
    OTP_TTL_SECONDS: parseInt(process.env.OTP_TTL_SECONDS || '60', 10),
    OTP_MAX_ATTEMPTS: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
  },

  //-----------mail ----------
  mail: {
    MAIL_DRIVER: process.env.MAIL_DRIVER || 'nodemailer',
    MAIL_FROM: process.env.MAIL_FROM || 'Your App <no-reply@yourapp.com>',
    
    // SMTP (Gmail/Mailtrap) Configs
    MAIL_HOST: process.env.MAIL_HOST || 'smtp.mailtrap.io',
    MAIL_PORT: parseInt(process.env.MAIL_PORT || '2525', 10),
    MAIL_USER: process.env.MAIL_USER || '',
    MAIL_PASS: process.env.MAIL_PASS || '',

    // AWS SES Configs
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  },

  frontend: {
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  loki: {
    LOKI_URL: process.env.LOKI_URL || 'http://localhost:3100',
  },
});
