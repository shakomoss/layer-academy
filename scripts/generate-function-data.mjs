// Cloudflare Pages Functions run independently of the Astro build and can't
// read Astro content collections at request time, so this script snapshots
// the pricing-relevant fields from src/content into plain JSON that
// functions/api/register.ts bundles directly. Runs as part of `npm run build`,
// so every deploy (including the daily scheduled rebuild) picks up the
// owner's latest edits from Pages CMS automatically.
import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const ROOT = path.resolve(import.meta.dirname, '..');
const COURSES_DIR = path.join(ROOT, 'src/content/courses');
const SETTINGS_FILE = path.join(ROOT, 'src/content/settings/settings.md');
const OUT_DIR = path.join(ROOT, 'functions/_data');

function readFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error(`No frontmatter found in ${filePath}`);
  return yaml.load(match[1]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const courseFiles = fs.readdirSync(COURSES_DIR).filter((f) => f.endsWith('.md'));
const courses = courseFiles.map((file) => {
  const data = readFrontmatter(path.join(COURSES_DIR, file));
  return {
    slug: data.slug,
    title: data.title,
    published: data.published !== false,
    group: {
      enabled: Boolean(data.group?.enabled),
      price: data.group?.price,
      earlyBirdPrice: data.group?.earlyBirdPrice,
      earlyBirdUntil: data.group?.earlyBirdUntil ? String(data.group.earlyBirdUntil) : undefined,
    },
    mentorship: {
      enabled: Boolean(data.mentorship?.enabled),
      monthlyPrice: data.mentorship?.monthlyPrice,
    },
  };
});

fs.writeFileSync(path.join(OUT_DIR, 'courses.json'), JSON.stringify(courses, null, 2), 'utf8');

const settingsData = fs.existsSync(SETTINGS_FILE) ? readFrontmatter(SETTINGS_FILE) : {};
const settings = {
  notificationEmail: settingsData.notificationEmail || '',
};

fs.writeFileSync(path.join(OUT_DIR, 'settings.json'), JSON.stringify(settings, null, 2), 'utf8');

console.log(`Wrote ${courses.length} course(s) and settings to functions/_data/`);
