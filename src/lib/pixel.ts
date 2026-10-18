declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[] };
    _fbq?: unknown;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
    FB?: { init: (options: Record<string, unknown>) => void };
    fbAsyncInit?: () => void;
  }
}

let pixelLoaded = false;
let ga4Loaded = false;
let clarityLoaded = false;
let messengerChatLoaded = false;

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

/** Microsoft Clarity's standard snippet, as a function: free session recordings + heatmaps. */
export function loadClarity(projectId: string): void {
  if (clarityLoaded || !projectId) return;
  clarityLoaded = true;

  const clarity: Window['clarity'] = function (...args: unknown[]) {
    clarity!.q!.push(args);
  };
  clarity.q = [];
  window.clarity = clarity;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${projectId}`;
  document.head.appendChild(script);
}

/**
 * Meta's Messenger "Customer Chat" plugin. Requires #fb-root and
 * #fb-customer-chat elements already present in the DOM (see
 * ConsentBanner.astro) — this only loads the SDK that renders into them.
 */
export function loadMessengerChat(pageId: string): void {
  if (messengerChatLoaded || !pageId) return;
  messengerChatLoaded = true;

  const chatbox = document.getElementById('fb-customer-chat');
  chatbox?.setAttribute('page_id', pageId);
  chatbox?.setAttribute('attribution', 'biz_inbox');

  window.fbAsyncInit = function () {
    window.FB?.init({ xfbml: true, version: 'v21.0' });
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/ka_GE/sdk/xfbml.customerchat.js';
  document.body.appendChild(script);
}
