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

export type ConsentChoice = 'accepted' | 'declined';

const UTM_STORAGE_KEY = 'la_utm_first_touch';
const CONSENT_STORAGE_KEY = 'la_consent';

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

export function getConsentChoice(): ConsentChoice | null {
  const value = localStorage.getItem(CONSENT_STORAGE_KEY);
  return value === 'accepted' || value === 'declined' ? value : null;
}

export function setConsentChoice(choice: ConsentChoice): void {
  localStorage.setItem(CONSENT_STORAGE_KEY, choice);
}

export function hasConsent(): boolean {
  return getConsentChoice() === 'accepted';
}

/** Every call below is a safe no-op when the visitor hasn't consented or the Pixel isn't loaded. */
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
