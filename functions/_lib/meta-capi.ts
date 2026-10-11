import type { ValidatedRegistration } from './validate';

const GRAPH_API_VERSION = 'v21.0';

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Meta expects digits only, including country code, no leading '+'. */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export interface MetaCapiContext {
  pixelId: string;
  accessToken: string;
  testEventCode?: string;
  clientIp: string;
  userAgent: string;
}

/**
 * Sends a server-side Lead event with the same event_id as the browser
 * Pixel's Lead event, so Meta deduplicates the two. Only called when the
 * visitor has given tracking consent (see trackingConsent on the
 * registration payload) — this is what "respect the visitor's consent
 * choice" means for the CAPI side specifically, since consent itself is
 * recorded client-side and has no server equivalent otherwise.
 */
export async function sendMetaCapiLead(data: ValidatedRegistration, context: MetaCapiContext): Promise<void> {
  const userData: Record<string, unknown> = {
    client_ip_address: context.clientIp || undefined,
    client_user_agent: context.userAgent || undefined,
    fbp: data.fbp || undefined,
    fbc: data.fbc || undefined,
  };

  if (data.email) userData.em = [await sha256Hex(normalizeEmail(data.email))];
  if (data.phone) userData.ph = [await sha256Hex(normalizePhone(data.phone))];

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_id: data.eventId,
        action_source: 'website',
        event_source_url: data.pageUrl,
        user_data: userData,
        custom_data: {
          value: data.price,
          currency: data.currency,
          content_name: data.courseTitle,
        },
      },
    ],
  };

  if (context.testEventCode) body.test_event_code = context.testEventCode;

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${context.pixelId}/events?access_token=${encodeURIComponent(context.accessToken)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Meta CAPI request failed (${response.status}): ${text}`);
  }
}
