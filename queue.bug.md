# BullMQ queue — vulnerability notes & status

This file tracks queue-related risks and what was fixed in code versus what remains an **operational / product** concern.

---

## Fixed in codebase

### 1. Cleartext OTP in Redis / DLQ / Postgres (was High)

**Issue:** OTP email job payloads included `otp` in plain text. Exhausted jobs copied `originalData` into the DLQ and `DeadLetterJob.payload`, persisting secrets.

**Fix:**

- `src/common/queues/utils/dlq-sanitize.util.ts` — `sanitizeOriginalDataForDlq()` redacts `otp` for `email_queue` + `send_otp_email`.
- Used when building DLQ payloads in `auth.processor.ts` / `email.processor.ts`, and again before `deadLetterJob.create()` in `dead-letter.processor.ts` (defence in depth).

**Residual risk:** Other secrets added to job payloads in the future must be added to the sanitizer (or avoid putting secrets in queue data; prefer opaque tokens).

---

### 2. Worker starvation — no job timeout (was High)

**Issue:** A hung SMTP/TCP call could block a worker slot until process restart.

**Fix:**

- `timeout: 20_000` ms on auth queue defaults + per-job in `AUTH_JOB_OPTIONS`.
- `timeout: 45_000` ms on email queue defaults + per-job in `EMAIL_JOB_OPTIONS`.

Tune in `queues.constants.ts` / `queues.module.ts` if your DB or mail SLA differs.

**Note:** Nest’s `registerQueue` typings omit `timeout` on some versions; DLQ jobs are short Prisma writes. Add an explicit `timeout` on `deadLetterQueue.add(...)` calls if you need a hard cap there too.

---

### 3. TLS for `rediss://` BullMQ connection (was Medium)

**Issue:** URL-only Bull connection did not attach explicit TLS options.

**Fix:** `bullMqConnectionFromConfig()` merges `tls: { rejectUnauthorized }` when the URL is `rediss://` or `REDIS_TLS=true`, driven by `REDIS_TLS_REJECT_UNAUTHORIZED` (default verify on).

**Standalone ioredis:** `getStandaloneRedisOptions()` now uses `{ rejectUnauthorized }` when TLS is enabled.

---

### 4. Email rate limiter variability

**Issue:** `queues.module.ts` had lost driver-based `limiter`; `EmailProcessor` used a hardcoded limiter only.

**Fix:** Restored queue-level `limiter` in `registerQueueAsync` (Gmail vs AWS vs default) and removed the duplicate worker `limiter` from `@Processor` so behaviour is single-sourced.

---

## Remaining risks (not fully solvable in queue layer alone)

### A. Redis memory pressure from enqueue floods (was Medium/High)

**Issue:** Public endpoints can enqueue faster than workers drain; Redis can grow until OOM.

**Mitigations (recommended):**

- HTTP `@nestjs/throttler` (and/or WAF) on routes that enqueue mail/OTP.
- Product caps (per user / per IP / per hour).
- Redis `maxmemory-policy`, monitoring, alerts on memory and queue depth.
- Optional: reject enqueue when `emailQueue.getWaitingCount()` exceeds a threshold (custom guard — not implemented here).

---

### B. `mail.MAIL_DRIVER === 'aws'`

If you use AWS SES via nodemailer, `MAIL_DRIVER` may still be `nodemailer`; the AWS-specific limiter branch may never run. Align env values or extend the factory condition when you standardise on SES.

---

## Quick reference — where to change behaviour

| Concern              | Location |
|----------------------|----------|
| Job timeouts         | `queues.constants.ts` (`AUTH_JOB_OPTIONS`, `EMAIL_JOB_OPTIONS`), `queues.module.ts` defaults |
| Email send rate      | `queues.module.ts` email `registerQueueAsync` `limiter` |
| DLQ redaction rules  | `queues/utils/dlq-sanitize.util.ts` |
| Redis TLS for Bull   | `redis/redis-options.factory.ts`, env `REDIS_URL` / `REDIS_TLS*` |
