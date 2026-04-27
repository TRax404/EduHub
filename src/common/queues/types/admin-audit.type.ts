import { AuditSeverity, AuditStatus } from '../constants/queues.constants';

export interface AdminAuditLogJobData {
  jobId: string;
  userId?: string;
  action: string;
  status: AuditStatus;
  severity: AuditSeverity;
  resource?: string;
  resourceId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export type AdminAuditLogInput = Omit<AdminAuditLogJobData, 'jobId'>;
