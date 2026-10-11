// Ambient window properties used to pass build-time (Astro frontmatter) data
// into client <script> tags via define:vars, read back by a separate
// statically-imported module script on the same page.
interface Window {
  __LA_PIXEL_ID__?: string;
  __LA_GA4_ID__?: string;
  __LA_VIEW_CONTENT__?: {
    contentName: string;
    contentCategory: 'group' | 'mentorship';
    value: number;
  };
}
