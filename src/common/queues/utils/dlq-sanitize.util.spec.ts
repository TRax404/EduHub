import { EmailJobNames, QueueNames } from '../constants/queues.constants';
import { sanitizeOriginalDataForDlq } from './dlq-sanitize.util';

describe('sanitizeOriginalDataForDlq', () => {
  it('redacts otp for exhausted OTP email jobs', () => {
    const raw = {
      jobId: 'j1',
      email: 'a@b.com',
      otp: '123456',
      type: 'register',
    };
    const out = sanitizeOriginalDataForDlq(
      QueueNames.EMAIL,
      EmailJobNames.SEND_OTP_EMAIL,
      raw,
    ) as Record<string, unknown>;
    expect(out.otp).toBe('[REDACTED]');
    expect(out.email).toBe('a@b.com');
  });

  it('leaves welcome email payload unchanged', () => {
    const raw = { jobId: 'j', email: 'x@y.com', name: 'X' };
    expect(
      sanitizeOriginalDataForDlq(
        QueueNames.EMAIL,
        EmailJobNames.SEND_WELCOME_EMAIL,
        raw,
      ),
    ).toEqual(raw);
  });
});
