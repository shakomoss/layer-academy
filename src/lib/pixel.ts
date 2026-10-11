declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[] };
    _fbq?: unknown;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let pixelLoaded = false;
let ga4Loaded = false;

/**
 * Meta's standard base code, as a reusable function instead of an inline
 * snippet: defines `fbq` as a queueing stub immediately so track() calls
 * made right after this (even before fbevents.js finishes downloading)
 * aren't lost.
 */
export function loadPixel(pixelId: string): void {
  if (pixelLoaded || !pixelId) return;
  pixelLoaded = true;

  const fbq: Window['fbq'] = function (...args: unknown[]) {
    if (fbq!.callMethod) {
      fbq!.callMethod(...args);
    } else {
      fbq!.queue!.push(args);
    }
  };
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  window.fbq('init', pixelId);
}

export function loadGa4(measurementId: string): void {
  if (ga4Loaded || !measurementId) return;
  ga4Loaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}
