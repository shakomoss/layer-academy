# Layer Academy website

The website for Layer Academy, a Georgian academy teaching architecture software (Archicad, AutoCAD, Revit, Rhino, 3ds Max) online — group cohorts and 1:1 mentorship.

This README is written for whoever owns and runs the site day-to-day, even without a programming background. It covers editing content, the two pieces of automatic logic the site has, setting up hosting and the admin panel, connecting a domain, Meta ads tracking, and what to do when something looks wrong.

If you get stuck on anything below, the fix for almost everything is: **edit the content in Pages CMS, or ask a developer** — you should never need to edit code for routine updates.

---

## 1. How the site is built, in one paragraph

The site is static HTML — there is no database and no server to maintain. [Astro](https://astro.build) turns content files (prices, schedules, bios, syllabi) into the actual pages once, at "build" time. Those files live in a GitHub repository and are edited through **Pages CMS**, a visual admin panel — every save there commits a change to GitHub, which automatically triggers **Cloudflare Pages** to rebuild and redeploy the site, usually within a minute or two. The only moving part that isn't pre-built HTML is the registration form, which is handled by one small Cloudflare Pages Function (`/api/register`) — still free, still nothing to maintain.

---

## 2. Editing content in Pages CMS

1. Go to [pagescms.org](https://pagescms.org) and sign in with the GitHub account that has access to this repository (see section 6 for first-time setup).
2. Select this repository. You'll see three sections in the sidebar: **კურსები** (courses), **ლექტორები** (lecturers), **ზოგადი პარამეტრები** (settings).
3. Click into any item, change the field you need, and click **Save**. Every field has a short Georgian explanation under its label.
4. Saving triggers a rebuild automatically. The live site updates in roughly 1–2 minutes — refresh the page to see your change.

### What you can edit without touching code

- **Courses** (`კურსები`): price, early-bird price and its expiry date, next start date, schedule text, duration, seats left, goal/outcome text, syllabus (either lesson-by-lesson or a flat topic list — see below), SEO title/description, published on/off.
- **Lecturers** (`ლექტორები`): name, title/profession, one-line summary, exactly 3 short credential tags, which courses they teach (a multi-select — this is what decides who shows up on each course/mentorship page, not a field on the course itself), and the full 2-paragraph bio. See section 2.1 for the privacy design behind this.
- **Settings** (`ზოგადი პარამეტრები`): phone, email, WhatsApp/Messenger/Instagram/Facebook links, the email address that receives registrations, the Meta domain verification code, and an optional announcement bar.

### 2.1 Lecturer privacy, by design

Lecturer names are shown on the website — on the homepage, on each course/mentorship page, and in the JSON-LD that search engines read. What's deliberately left out everywhere is **photos and LinkedIn links** — there's no photo field and no LinkedIn field anywhere in the schema, so don't add either without checking first. Names are not used on social-media posts or printed posters (that's a separate, non-code concern for whoever makes those assets) — but the website itself is meant to name the lecturer.

### Syllabus: two formats, pick one per course

Each course has **either**:
- **გაკვეთილები** (lessons) — a numbered list, each with its own title and a list of topics. This renders as an accordion (used for Archicad). Use this when the course naturally breaks into weekly lessons.
- **თემები** (topics) — one flat list of topics, shown as a two-column list (used for AutoCAD, Revit, Rhino). Use this for everything else.

You only need to fill in one of the two. Leave both empty and the page shows "სილაბუსი მალე დაემატება" (syllabus coming soon) instead of a placeholder.

---

## 3. The two pieces of automatic logic

These need no manual updates — they're mentioned here so you understand why a price or date on the site might change on its own.

### "Next cohort" label

Every group course page shows when the next intake is. If you haven't set a specific **"შემდეგი ჯგუფის დაწყების თარიღი"** (next start date) for a course, the site automatically shows "intake for next month's cohort" and updates that wording itself when the calendar rolls over to a new month — you never have to touch it.

If you **do** set a specific start date (like AutoCAD's 2026-10-26), the site shows that exact date instead, right up until the date passes — then it automatically falls back to the "next month" wording again. You can safely leave an old date in place; it just stops being shown once it's in the past.

### Early-bird pricing

If you set both an **early-bird price** and an **expiry date**, the course page shows the regular price struck through next to the early-bird price, with "discounted until [date]". The moment that date passes, the site automatically goes back to showing only the regular price — again, nothing to do manually. To end a discount early, just delete the early-bird price and date.

Both of these are recalculated automatically every day (see "Daily rebuild" below) *and* once more in the visitor's own browser when they load the page, so the label is never stale even on a cached page.

---

## 4. First deploy — one-time setup

If the site isn't live yet, here's the order of operations.

### 4.1 Push the code to GitHub

```sh
git remote add origin https://github.com/<your-username>/layer-academy.git
git push -u origin master
```

(Create an empty repository on GitHub first, named however you like — don't initialize it with a README, since this project already has one.)

### 4.2 Create the Cloudflare Pages project

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick the repository.
2. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. Before the first deploy, add the environment variables from section 5 below (**Settings → Environment variables**). At minimum, set `SITE_URL` to your real domain.
4. Deploy. Cloudflare gives you a free `*.pages.dev` URL immediately; see section 7 to attach your own domain.

### 4.3 Connect Pages CMS

1. Go to [pagescms.org](https://pagescms.org) → **Add new project** → authorize the Pages CMS GitHub App for this repository.
2. Pages CMS reads `.pages.yml` from the repo root automatically — nothing else to configure.
3. Give access to anyone else who should be able to edit content by inviting their GitHub account to the repository (as a Collaborator) and to the Pages CMS project.

### 4.4 Daily rebuild (GitHub Actions)

The "next cohort" label and early-bird expiry (section 3) only update themselves on a rebuild. Since nobody necessarily edits the site every day, a scheduled GitHub Action rebuilds it automatically once every night.

1. In Cloudflare Pages: your project → **Settings → Builds & deployments → Deploy hooks** → **Add deploy hook**. Name it anything (e.g. "Daily rebuild"), branch `master`. Copy the generated URL.
2. In GitHub: this repository → **Settings → Secrets and variables → Actions → New repository secret**.
   - Name: `CLOUDFLARE_DEPLOY_HOOK_URL`
   - Value: the URL you copied.
3. That's it — `.github/workflows/daily-rebuild.yml` is already in the repo and will start running on its schedule (just after midnight, Tbilisi time). You can also trigger it manually any time from the **Actions** tab → **Daily rebuild** → **Run workflow**.

---

## 5. Environment variables

Set these in Cloudflare Pages: **your project → Settings → Environment variables** (set them for both *Production* and *Preview* if you want preview deployments to behave the same way). `.env.example` in the repo lists the same variables for local development.

The site is designed to **work before any of these are set** — registrations just get logged instead of emailed, and the Pixel/CAPI/Turnstile pieces simply don't activate until configured. Add them whenever you're ready, in any order.

| Variable | Required for | Where to get it |
|---|---|---|
| `SITE_URL` | Correct links everywhere (sitemap, canonical tags, share previews) | Your real domain, e.g. `https://layeracademy.ge` — no trailing slash |
| `PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Spam protection on the registration form | Cloudflare dashboard → **Turnstile** → Add site. The "site key" is public, the "secret key" is not — keep it private |
| `RESEND_API_KEY` | Emailing registrations to you and confirmations to students | [resend.com](https://resend.com) → API Keys. See section 8 for free-tier limits and why Resend |
| `PUBLIC_META_PIXEL_ID` + `META_CAPI_TOKEN` | Meta ads tracking (Pixel + Conversions API) | Meta Events Manager → your Pixel → Settings. See section 9 |
| `META_TEST_EVENT_CODE` | *Temporary* — only while testing in Meta Events Manager's Test Events tab | Same screen as above; **remove this variable once you're done testing** |
| `PUBLIC_GA4_ID` | Optional Google Analytics 4 | analytics.google.com → Admin → Data Streams |
| `PUBLIC_CLARITY_ID` | Optional Microsoft Clarity (free session recordings + heatmaps) | [clarity.microsoft.com](https://clarity.microsoft.com) → New project. See section 7.1 |
| `PUBLIC_MESSENGER_PAGE_ID` | Optional Messenger live chat bubble | Your Facebook Page → Settings → General → Page ID. See section 7.2 |

**Rate limiting note:** the registration endpoint has basic abuse protection built in even with no extra setup. For stronger protection, bind a free Cloudflare KV namespace named `RATE_LIMIT_KV` to the Pages project (**Settings → Functions → KV namespace bindings**) — no code changes needed, the Function picks it up automatically if present.

---

## 6. Connecting your domain

1. Cloudflare Pages → your project → **Custom domains** → **Set up a custom domain**.
2. Follow the prompts (if the domain's DNS is already on Cloudflare, this is a couple of clicks; otherwise you'll add a CNAME record at your registrar).
3. Update `SITE_URL` in the environment variables (section 5) to match, and trigger a rebuild (any content save in Pages CMS does this, or run the GitHub Action manually).

---

## 7. Meta Pixel and Conversions API

Ads tracking is **off by default** — the site works fully without it, and nothing related to Meta loads until a visitor accepts the cookie banner.

### Setup

1. Create a Pixel in [Meta Events Manager](https://www.facebook.com/events_manager2) if you don't have one.
2. Copy the **Pixel ID** into `PUBLIC_META_PIXEL_ID`.
3. In the Pixel's **Settings** tab, generate a **Conversions API access token** and put it in `META_CAPI_TOKEN`. This powers a *server-side* copy of the Lead event (sent from the registration Function, not the browser), which makes tracking more reliable against ad blockers — Meta automatically deduplicates it against the browser Pixel's own Lead event using a shared event ID, so leads aren't double-counted.
4. If your domain isn't verified yet: Meta Business Settings → **Brand Safety → Domains** gives you a verification code — put it in the `metaDomainVerification` field in Pages CMS → Settings. It'll appear in the page `<head>` automatically.

### Testing

1. Meta Events Manager → your Pixel → **Test Events**. Copy the code shown there into `META_TEST_EVENT_CODE`, redeploy.
2. Browse the site, submit a test registration. You should see `PageView`, `ViewContent` (on a course page), `Contact` (clicking a WhatsApp/phone link), and `Lead` (after registering) show up in Test Events in real time — each with a green "matched" server-side event too, confirming the Conversions API side is also working.
3. **Remove `META_TEST_EVENT_CODE` once done** — leaving it set sends real traffic as test traffic, which Meta won't use for ad optimization.

### Later: offline conversions

Once a registered student actually pays and starts, you can upload that as an **offline conversion** in Events Manager (Business Settings → **Data Sources → Offline Event Sets**) — match by the phone/email they registered with. This closes the loop from "lead" to "paying student" for ad optimization, without any code changes; it's a manual CSV upload (or a spreadsheet export from wherever you track payments) whenever you want to do it.

### 7.1 Microsoft Clarity (optional)

What it actually is: a free tool that records anonymized screen sessions of real visitors and builds click/scroll heatmaps — so instead of guessing why someone didn't register, you can literally watch the recording and see where they hesitated, scrolled past, or gave up. No code or technical skill needed to use it day-to-day, just a dashboard.

1. [clarity.microsoft.com](https://clarity.microsoft.com) → sign in → **New project** → point it at your domain.
2. Copy the **Project ID** (in the project's Setup instructions) into `PUBLIC_CLARITY_ID`, redeploy.
3. Give it a day or two of real traffic, then check the **Recordings** and **Heatmaps** tabs in the Clarity dashboard. That's the entire workflow — nothing to configure on an ongoing basis.

Same consent rule as the Pixel: it only loads after a visitor accepts the cookie banner.

### 7.2 Messenger live chat (optional)

Adds the Messenger chat bubble (bottom-right) so visitors can message your Facebook Page directly from the site, and you reply from Messenger like normal.

1. You need an existing Facebook **Page** for the business (not a personal profile) — if you don't have one yet, create it at facebook.com/pages/create first.
2. Find the Page ID: your Page → **Settings → General**, or go to `facebook.com/<your-page>/about` and scroll to the bottom.
3. Put that ID in `PUBLIC_MESSENGER_PAGE_ID`, redeploy.
4. Meta also requires you to **allowlist your domain** for the chat plugin once: Facebook Page → Settings → **Advanced Messaging** (or Meta Business Suite → Inbox settings) → add `layeracademy.ge` (your real domain) under allowed domains for Customer Chat.

One thing to watch for once it's live: the chat bubble and the mobile sticky price bar on course pages both sit near the bottom of the screen — check on a real phone that they don't visually overlap, and tell me if they do so I can adjust the positioning.

---

## 8. Why Resend, and a note on the registration form's architecture

The original plan was a simple third-party form-to-email service (Web3Forms or Formspree). During implementation it became clear the brief's own requirements for the registration endpoint — **recomputing the price server-side so the browser can never submit a tampered price**, verifying Turnstile, and sending a server-side Meta Conversions API event — need actual server-side logic that a bare form-relay service can't provide (they just forward whatever fields you send, with no way to run validation or business logic in between).

So the registration form posts to a small Cloudflare Pages Function (`/api/register`, part of this repo, still $0 to run) instead, which does that validation and then sends email itself via **[Resend](https://resend.com)**, a transactional email API — the free tier covers 3,000 emails/month and 100/day (check [resend.com/pricing](https://resend.com/pricing) for current numbers), which is far more than a course-registration volume needs. This also meant Web3Forms/Formspree's own spam protection wasn't available, so the form has its own honeypot field plus Cloudflare Turnstile instead.

Emails send from `registration@layeracademy.ge` (verified in Resend) — if you ever need to change the sender address, update the `fromEmail` constant in `functions/api/register.ts`.

---

## 9. What to do when something breaks

**A content edit isn't showing up on the live site.**
Check Cloudflare Pages → your project → **Deployments** tab. If the latest deployment failed (red ❌), click it to see the error — it's almost always a content field that doesn't match what's expected (e.g. a price field containing text instead of a number). Fix it in Pages CMS and save again. If it succeeded (green ✓) but you still don't see the change, hard-refresh your browser (Ctrl/Cmd+Shift+R) — you may be looking at a cached copy.

**Registrations aren't arriving by email.**
Confirm `RESEND_API_KEY` and the "ელ-ფოსტა რეგისტრაციების მისაღებად" (notification email) field in Pages CMS → Settings are both set — without either, the Function logs the submission instead of emailing it (by design, so the form never hard-fails). Check Cloudflare Pages → **Functions** logs for `[register]` entries to see what happened to a specific submission.

**The registration form says "too many requests."**
That's the rate limiter — it allows 5 submissions per IP per minute. A genuine student retrying a failed submission a few times will never hit this; it's aimed at bots. It clears itself after a minute.

**A price or date isn't updating.**
Check sections 3 and 4.4 above — if the daily rebuild stopped running (check the **Actions** tab in GitHub for failed runs), the automatic month/date rollover won't happen until the next successful rebuild. Any manual content save also triggers a rebuild, so saving anything (even re-saving the same value) in Pages CMS is a quick manual fix.

**Something looks visually broken.**
This is very likely a real bug rather than a content issue — take a screenshot and send it to a developer rather than guessing at a fix in Pages CMS.

---

## 10. For developers

```sh
npm install
npm run dev              # local dev server at localhost:4321
npm run build             # production build to ./dist (also regenerates functions/_data/*.json and public/og/*.png)
npm run preview           # serve the built site locally
npm run test               # cohort/early-bird utility unit tests (vitest)
npm run typecheck:functions  # typecheck the Cloudflare Pages Function in functions/
```

To test the registration Function locally end-to-end (Astro's own dev server doesn't run Pages Functions):

```sh
npm run build
npx wrangler pages dev ./dist
```

### Notable architecture decisions

- **`functions/_data/*.json`** is generated from `src/content/courses` and `src/content/settings` at build time (`scripts/generate-function-data.mjs`) because Cloudflare Pages Functions run at the edge and can't read Astro content collections directly. It's regenerated on every build, so Pages CMS edits always reach the Function on the next deploy — never hand-edit these files.
- **Instructor-to-course lookup runs instructor → courses, not course → instructor** — each lecturer has a `courses` multi-select listing the slugs they teach, and `src/lib/instructors.ts#getInstructorForCourse` finds the match by searching that list. There's no `instructor` field on the course itself.
- **CSP (`public/_headers`)** allows `'unsafe-inline'` for `script-src` and `style-src`. This is a deliberate tradeoff, not an oversight: Astro's static build inlines some small component scripts/styles directly into the HTML (standard Vite bundling behavior for small single-use chunks), which a strict CSP would block outright. Since this site has no user-generated content rendered anywhere (all template expressions are developer-authored and Astro auto-escapes everything), the realistic XSS risk `'unsafe-inline'` opens up here is low. A stricter CSP via hash-pinning is possible but would need re-pinning on every edit to those specific scripts — not worth the fragility for this site.
- **OG images** (`public/og/*.png`) are generated at build time from hand-built SVGs rasterized with `@resvg/resvg-js`, embedding real Jost/Noto Sans Georgian TTFs (`scripts/assets/`) rather than relying on fonts being installed in the build container.

---

## 11. Known placeholders and things to follow up on

These were intentionally left for the owner to fill in, since the brief says never to invent facts:

- **Lecturer profiles** — both are now filled in and live (name, title, one-liner, 3 credential tags, full bio) per the privacy design in section 2.1 (name shown, no photo/LinkedIn). Nothing left to fill in here unless you want to add a third lecturer or change what an existing one teaches, both doable in Pages CMS.
- **Contact details** (`ზოგადი პარამეტრები` in Pages CMS) — phone, email, WhatsApp, Facebook, and the registration notification email are filled in. Instagram and Messenger links are still empty (each is hidden on the site until set).
- **Schedules** for Revit, Rhino, and 3ds Max group courses — left as "TBA" per the brief (the site shows "schedule to be confirmed soon" automatically). Fill in via the `group.schedule` field once decided.
- **3ds Max syllabus** — left empty per the brief (shows "syllabus coming soon" automatically). Add via `syllabus.topics` in Pages CMS once ready.
- **Privacy policy and Terms** — full drafts written against what the site actually does (registration fields, Resend, Cloudflare/Turnstile, Meta Pixel + CAPI with hashed email/phone, consent gating). Refunds: 14-day cancellation right, full refund before start, proportional refund of undelivered lessons/sessions after start, paid out within 7 days. The registration form requires two checkboxes — accepting Terms + Privacy, and agreeing that the course may start inside the 14-day window (that's what lets you charge for lessons already delivered); both are enforced server-side and recorded in the notification email. Not reviewed by a lawyer. Clarity is already listed on the privacy page; if you add another tool (GA4, Messenger chat), update the cookies section and the "who we share data with" list there.
- **GA4 ID, Clarity ID, Messenger Page ID** — still unset (optional); see sections 5, 7.1, 7.2. Meta Pixel, CAPI, Turnstile, and Resend (with verified `layeracademy.ge` sending domain) are all configured and verified live.
