// Generates one 1200x630 OG image per published course/mentorship program,
// in the site's own visual language, so Meta/Instagram link previews don't
// fall back to a generic card. Runs at build time (see package.json) and
// writes into public/og/ so Astro copies the PNGs verbatim into dist/.
import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import * as yaml from 'js-yaml';

const ROOT = path.resolve(import.meta.dirname, '..');
const COURSES_DIR = path.join(ROOT, 'src/content/courses');
const OUT_DIR = path.join(ROOT, 'public/og');
const JOST_FONT = path.join(ROOT, 'scripts/assets/Jost-Variable.ttf');
const GEORGIAN_FONT = path.join(ROOT, 'scripts/assets/NotoSansGeorgian-Variable.ttf');

const WIDTH = 1200;
const HEIGHT = 630;
const BG = '#F7F5F0';
const INK = '#1C1B19';
const GRID = '#EAE7DF';
const MUTED = '#55514A';

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildSvg({ title, subtitle }) {
  const gridLines = [];
  for (let x = 0; x <= WIDTH; x += 120) gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${HEIGHT}" />`);
  for (let y = 0; y <= HEIGHT; y += 120) gridLines.push(`<line x1="0" y1="${y}" x2="${WIDTH}" y2="${y}" />`);

  return `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}" />
  <g stroke="${GRID}" stroke-width="1">${gridLines.join('')}</g>

  <text x="${WIDTH / 2}" y="140" text-anchor="middle" font-family="Jost" font-weight="400"
        font-size="28" letter-spacing="9" fill="${INK}">LAYER ACADEMY</text>
  <line x1="${WIDTH / 2 - 140}" y1="166" x2="${WIDTH / 2 + 140}" y2="166" stroke="${INK}" stroke-width="1" />

  <text x="${WIDTH / 2}" y="340" text-anchor="middle" font-family="Jost" font-weight="300"
        font-size="96" letter-spacing="6" fill="${INK}">${escapeXml(title.toUpperCase())}</text>

  <text x="${WIDTH / 2}" y="410" text-anchor="middle" font-family="Noto Sans Georgian" font-weight="400"
        font-size="30" fill="${MUTED}">${escapeXml(subtitle)}</text>
</svg>`.trim();
}

function render(svg, outPath) {
  const resvg = new Resvg(svg, {
    font: {
      fontFiles: [JOST_FONT, GEORGIAN_FONT],
      loadSystemFonts: false,
      defaultFontFamily: 'Jost',
    },
    background: BG,
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(outPath, png);
}

function readFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  // \r? throughout: Pages CMS writes files via GitHub's API with CRLF line
  // endings, while files written directly in this repo use LF — handle both.
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return yaml.load(match[1]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const courseFiles = fs.readdirSync(COURSES_DIR).filter((f) => f.endsWith('.md'));
let count = 0;

for (const file of courseFiles) {
  const data = readFrontmatter(path.join(COURSES_DIR, file));
  if (!data.published) continue;

  if (data.group?.enabled) {
    render(buildSvg({ title: data.title, subtitle: 'ჯგუფური კურსი — საფუძვლები დამწყებთათვის' }), path.join(OUT_DIR, `${data.slug}-group.png`));
    count++;
  }
  if (data.mentorship?.enabled) {
    render(buildSvg({ title: data.title, subtitle: 'ინდივიდუალური მენტორინგი' }), path.join(OUT_DIR, `${data.slug}-mentorship.png`));
    count++;
  }
}

render(buildSvg({ title: 'LAYER ACADEMY', subtitle: 'არქიტექტურული პროგრამების კურსები და მენტორინგი' }), path.join(OUT_DIR, 'default.png'));
count++;

console.log(`Generated ${count} OG image(s) in public/og/`);
