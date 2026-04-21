import { AuditSeverity, AuditStatus, AuthJobNames } from '../constants/queues.constants';

// ─── Login History ────────────────────────────────────────────────────────────
export interface LoginHistoryJobData {
    jobId: string;          // for idempotency — pass job.id at enqueue time
    userId: string;
    ipAddress: string;
    device: string;
    geoLocation?: string;
    isSuspicious?: boolean;
    loginMethod?: string;
    mfaUsed?: boolean;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export interface AuditLogJobData {
    jobId: string;          // for idempotency
    userId?: string;
    action: string;
    status: AuditStatus;                      // was: string
    severity: AuditSeverity;                  // was: string
    resource?: string;
    resourceId?: string;
    correlationId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
}

// ─── Dead Letter ──────────────────────────────────────────────────────────────
export interface DeadLetterJobData {
    originalQueue: string;
    originalJobName: string;
    originalJobId: string | undefined;
    originalData: any;
    errorMessage: string;
    errorStack?: string;
    attemptsMade: number;
    exhaustedAt: string;    // ISO string
}

// ─── Producer input types (jobId injected internally, not by caller) ──────────
export type LoginHistoryInput = Omit<LoginHistoryJobData, 'jobId'>;
export type AuditLogInput = Omit<AuditLogJobData, 'jobId'>;