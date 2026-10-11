declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}

const UTM_STORAGE_KEY = 'la_utm_first_touch';

function readCookie(name: string): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

/** First-touch UTM attribution: captured once per browser session, then reused. */
export function captureUtm(): UtmParams {
  const existing = sessionStorage.getItem(UTM_STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing) as UtmParams;
    } catch {
      // fall through and re-capture below
    }
  }

  const params = new URLSearchParams(window.location.search);
  const utm: UtmParams = {
    source: params.get('utm_source') || '',
    medium: params.get('utm_medium') || '',
    campaign: params.get('utm_campaign') || '',
    term: params.get('utm_term') || '',
    content: params.get('utm_content') || '',
  };

  sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  return utm;
}

export function getFbp(): string {
  return readCookie('_fbp');
}

export function getFbc(): string {
  return readCookie('_fbc');
}

export function generateEventId(): string {
  return crypto.randomUUID();
}

function hasConsent(): boolean {
  return localStorage.getItem('la_consent') === 'accepted';
}

/** No-ops until the consent banner (and Pixel loader) are wired up — safe to call from anywhere. */
export function trackPageView(): void {
  if (hasConsent() && window.fbq) window.fbq('track', 'PageView');
}

export function trackViewContent(params: { contentName: string; contentCategory: 'group' | 'mentorship'; value: number }): void {
  if (hasConsent() && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_name: params.contentName,
      content_category: params.contentCategory,
      value: params.value,
      currency: 'GEL',
    });
  }
}

export function trackContact(): void {
  if (hasConsent() && window.fbq) window.fbq('track', 'Contact');
}

export function trackLead(params: { contentName: string; value: number; eventId: string }): void {
  if (hasConsent() && window.fbq) {
    window.fbq(
      'track',
      'Lead',
      { content_name: params.contentName, value: params.value, currency: 'GEL' },
      { eventID: params.eventId }
    );
  }
}
