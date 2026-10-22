import { buildOwnerEmail, buildStudentEmail, sendEmail } from '../_lib/email';
import { sendMetaCapiLead } from '../_lib/meta-capi';
import { isWithinRateLimit } from '../_lib/rate-limit';
import { verifyTurnstile } from '../_lib/turnstile';
import type { CourseManifestEntry, Env, SettingsManifest } from '../_lib/types';
import { validateRegistration, type RegistrationInput } from '../_lib/validate';
import courses from '../_data/courses.json';
import settings from '../_data/settings.json';

const GENERIC_ERROR = 'დაფიქსირდა შეცდომა. გთხოვთ, სცადოთ ხელახლა ან დაგვიკავშირდეთ სხვა ხერხით.';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const allowed = await isWithinRateLimit(ip, env.RATE_LIMIT_KV);
    if (!allowed) {
      return json({ ok: false, error: 'მოთხოვნები ძალიან ხშირია. გთხოვთ, სცადოთ რამდენიმე წუთში.' }, 429);
    }

    let input: RegistrationInput;
    try {
      input = (await request.json()) as RegistrationInput;
    } catch {
      return json({ ok: false, error: GENERIC_ERROR }, 400);
    }

    // Honeypot: real users never see or fill this field. Pretend success so
    // bots don't learn their submission was rejected.
    if (typeof input.website === 'string' && input.website.trim() !== '') {
      return json({ ok: true });
    }

    if (env.TURNSTILE_SECRET_KEY) {
      const token = typeof input.turnstileToken === 'string' ? input.turnstileToken : '';
      const verified = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip);
      if (!verified) {
        return json({ ok: false, error: 'გთხოვთ, დაადასტუროთ, რომ არ ბოტი ხართ.' }, 400);
      }
    } else {
      console.warn('[register] TURNSTILE_SECRET_KEY not set — skipping verification (dev mode).');
    }

    const result = validateRegistration(input, courses as CourseManifestEntry[]);
    if (!result.ok) {
      return json({ ok: false, error: result.error.message, field: result.error.field }, 400);
    }

    const data = result.data;
    const { notificationEmail } = settings as SettingsManifest;
    const fromEmail = 'Layer Academy <onboarding@resend.dev>';

    if (env.RESEND_API_KEY && notificationEmail) {
      try {
        const ownerEmail = buildOwnerEmail(data);
        await sendEmail(env.RESEND_API_KEY, fromEmail, { to: notificationEmail, ...ownerEmail });

        if (data.email) {
          const studentEmail = buildStudentEmail(data);
          await sendEmail(env.RESEND_API_KEY, fromEmail, { to: data.email, ...studentEmail });
        }
      } catch (error) {
        // A Resend outage or misconfiguration (e.g. sandbox mode rejecting the
        // recipient) must never fail the student's registration — same reasoning
        // as the Meta CAPI call below.
        console.error('[register] Email send failed:', error);
      }
    } else {
      console.log('[register] RESEND_API_KEY or notificationEmail not set — logging instead of sending:', data);
    }

    if (data.trackingConsent && env.META_CAPI_TOKEN && env.PUBLIC_META_PIXEL_ID) {
      try {
        await sendMetaCapiLead(data, {
          pixelId: env.PUBLIC_META_PIXEL_ID,
          accessToken: env.META_CAPI_TOKEN,
          testEventCode: env.META_TEST_EVENT_CODE,
          clientIp: ip,
          userAgent: request.headers.get('User-Agent') || '',
        });
      } catch (error) {
        // A Meta outage or bad token must never fail the student's registration.
        console.error('[register] Meta CAPI call failed:', error);
      }
    }

    return json({ ok: true });
  } catch (error) {
    console.error('[register] Unexpected error:', error);
    return json({ ok: false, error: GENERIC_ERROR }, 500);
  }
};
