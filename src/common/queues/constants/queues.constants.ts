import { JobsOptions } from 'bullmq';

/** BullMQ supports per-job `timeout`; explicit here so hung handlers release concurrency. */
export type AppJobsOptions = JobsOptions & { timeout?: number };

// ─── Queue Names ──────────────────────────────────────────────────────────────
export enum QueueNames {
  AUTH = 'auth_queue',
  EMAIL = 'email_queue',
  DEAD_LETTER = 'dead_letter_queue',
}

// ─── Job Names ────────────────────────────────────────────────────────────────
export enum AuthJobNames {
  CREATE_LOGIN_HISTORY = 'create_login_history',
  RECORD_AUDIT_LOG = 'record_audit_log',
}

export enum EmailJobNames {
  SEND_WELCOME_EMAIL = 'send_welcome_email',
  SEND_OTP_EMAIL = 'send_otp_email',
}

export enum DeadLetterJobNames {
  FAILED_JOB = 'failed_job',
}

// ─── Severity Enum (replaces raw string) ─────────────────────────────────────
export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ─── Audit Status Enum ────────────────────────────────────────────────────────
export enum AuditStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PENDING = 'PENDING',
}

// ─── Per-Job Options ──────────────────────────────────────────────────────────
/** Hard cap on handler runtime so workers cannot hang forever (frees concurrency slots). */
const AUTH_JOB_TIMEOUT_MS = 20_000;

export const AUTH_JOB_OPTIONS: Record<AuthJobNames, AppJobsOptions> = {
  [AuthJobNames.CREATE_LOGIN_HISTORY]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2_000 },
    timeout: AUTH_JOB_TIMEOUT_MS,
    removeOnComplete: { count: 50, age: 24 * 3600 },
    removeOnFail: { count: 100 },
  },
  [AuthJobNames.RECORD_AUDIT_LOG]: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1_000 },
    timeout: AUTH_JOB_TIMEOUT_MS,
    removeOnComplete: { count: 50, age: 24 * 3600 },
    removeOnFail: { count: 200 },
    priority: 1,
  },
};

/** SMTP / SES can stall on TCP; fail the job so the slot is released. */
const EMAIL_JOB_TIMEOUT_MS = 45_000;

export const EMAIL_JOB_OPTIONS: Record<EmailJobNames, AppJobsOptions> = {
  [EmailJobNames.SEND_WELCOME_EMAIL]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
    timeout: EMAIL_JOB_TIMEOUT_MS,
    removeOnComplete: { count: 50, age: 24 * 3600 },
    removeOnFail: { count: 100 },
  },
  [EmailJobNames.SEND_OTP_EMAIL]: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2_000 },
    timeout: EMAIL_JOB_TIMEOUT_MS,
    removeOnComplete: { count: 50, age: 24 * 3600 },
    removeOnFail: { count: 100 },
  },
};