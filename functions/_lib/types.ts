export interface CourseManifestEntry {
  slug: string;
  title: string;
  published: boolean;
  group: {
    enabled: boolean;
    price: number;
    earlyBirdPrice?: number;
    earlyBirdUntil?: string;
  };
  mentorship: {
    enabled: boolean;
    price: number;
  };
}

export interface SettingsManifest {
  notificationEmail: string;
}

export interface Env {
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  RATE_LIMIT_KV?: KVNamespace;
  META_CAPI_TOKEN?: string;
  // Same variable the browser Pixel snippet reads — Cloudflare exposes every
  // configured env var to Functions regardless of the PUBLIC_ prefix, which
  // is only an Astro/Vite client-bundling convention. No need for a second,
  // server-only duplicate of the same Pixel ID.
  PUBLIC_META_PIXEL_ID?: string;
  META_TEST_EVENT_CODE?: string;
}
