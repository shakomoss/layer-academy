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
    monthlyPrice: number;
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
  META_PIXEL_ID?: string;
  META_TEST_EVENT_CODE?: string;
}
