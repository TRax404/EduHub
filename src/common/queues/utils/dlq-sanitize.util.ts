import { EmailJobNames, QueueNames } from '../constants/queues.constants';

/**
 * Strip secrets from payloads before they are written to the DLQ (Redis) or DeadLetterJob (Postgres).
 * OTP and similar fields must never be persisted for debugging.
 */
export function sanitizeOriginalDataForDlq(
  originalQueue: string,
  originalJobName: string,
  data: unknown,
): unknown {
  if (
    originalQueue === QueueNames.EMAIL &&
    originalJobName === EmailJobNames.SEND_OTP_EMAIL &&
    typeof data === 'object' &&
    data !== null
  ) {
    const copy = { ...(data as Record<string, unknown>) };
    if ('otp' in copy) {
      copy.otp = '[REDACTED]';
    }
    return copy;
  }
  return data;
}
