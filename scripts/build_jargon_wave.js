#!/usr/bin/env node
/* Build a "define the jargon" workflow for a deck: rich, clickable reference entries for the
 * acronyms/terms the deck USES but never defines. Curated allow-list (real web/frontend jargon),
 * each given usage-context snippets pulled from the deck so the model defines the right sense.
 *   node scripts/build_jargon_wave.js <out-workflow-path>
 * Output workflow returns result.batches[] = { entries:[{key,term,aliases,group,eli5,memory,full,worked,teach,related}] }. */
const fs = require('fs'), path = require('path');
const OUT = process.argv[2];
if (!OUT) { console.error('usage: node scripts/build_jargon_wave.js <out-path>'); process.exit(2); }

const GLOSSARY_DATA = {}, CARDS_DATA = [], SECTIONS_DATA = {}, DECKS_DATA = [], ENHANCE = {}, QUIZ_DATA = [];
function enh(o) { for (const k in o) ENHANCE[k] = Object.assign(ENHANCE[k] || {}, o[k]); }
const stub = () => '';
const P = ['GLOSSARY_DATA','CARDS_DATA','SECTIONS_DATA','DECKS_DATA','ENHANCE','enh','QUIZ_DATA','CODE','TABLE','CONSOLE','HIGHLIGHT','SEQUENCE','BOXES','DIAGRAM'];
const A = [GLOSSARY_DATA,CARDS_DATA,SECTIONS_DATA,DECKS_DATA,ENHANCE,enh,QUIZ_DATA,stub,stub,stub,stub,stub,stub,stub];
for (const f of fs.readdirSync('content').filter(f => f.endsWith('.js')).sort()) { try { new Function(...P, fs.readFileSync(path.join('content', f), 'utf8'))(...A); } catch (e) {} }
for (const id in ENHANCE) { if (GLOSSARY_DATA[id]) Object.assign(GLOSSARY_DATA[id], ENHANCE[id]); }
const FT = new Set(DECKS_DATA.find(d => d.id === 'frontend').topics);

// curated allow-list of REAL frontend/web jargon the deck uses but never defines
const KEEP = [
  'WCAG','ARIA','WAI-ARIA','WAI','a11y','POUR','ADA','NVDA','JAWS','APG','APCA','UIA','accname',
  'LCP','INP','FID','CWV','TTFB','FCP','TBT','RUM','FOIT','FOUT','FOUC','DPR','CSSOM',
  'SSR','CSR','SSG','RSC','SPA','MFE','MVC','FSM','TTI','hydration',
  'CORS','SOP','URL','URI','XHR','MIME','CRUD','JSONP','SNI','COOP','COEP','IDN','SSO','W3C','WHATWG','RFC','HTTP methods','BOM',
  'SRI','HSTS','XFO','clickjacking','prototype pollution',
  'DOM','JSX','ESM','CJS','TDZ','AST','IIFE','HOL','LIFO',
  'BFC','OKLCH','HSL','BEM','specificity',
  'HMR','RTL','MSW','RTK','SWR','E2E','CRA','CDP',
  'AVIF','WebP','SEO','GPU','i18n','l10n','CJK','IME','UTF','HTML','CSS','API','CMS','LLM'
];

// usage-context: up to 2 short snippets per term, drawn from frontend card/glossary/teach text
const blocks = [];
CARDS_DATA.forEach(c => { if (FT.has(c.sec)) blocks.push(c.back); });
for (const id in GLOSSARY_DATA) { const g = GLOSSARY_DATA[id]; if (!FT.has(g.group)) continue; [g.full, g.eli5, g.trap, g.worked, g.teach].forEach(x => x && blocks.push(x)); }
const plain = blocks.map(b => String(b).replace(/<[^>]+>/g, ' ').replace(/&lt;|&gt;|&amp;|&#39;|&quot;/g, ' ').replace(/\s+/g, ' '));
function context(term) {
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(?<![\\w-])' + esc + '(?![\\w-])');
  const hits = [];
  for (const s of plain) { if (re.test(s)) { const sent = s.split(/(?<=[.!?])\s/).find(x => re.test(x)) || s; hits.push(sent.trim().slice(0, 180)); if (hits.length >= 2) break; } }
  return hits;
}
const TERMS = KEEP.map(t => ({ term: t, uses: context(t) }));

const FE_TOPICS = '[FE-HTML, FE-CSS, FE-CSSARCH, FE-JS, FE-ASYNC, FE-TS, FE-DOM, FE-REACT, FE-STATE, FE-PERF, FE-A11Y, FE-NET, FE-SEC, FE-TEST, FE-SYSDESIGN]';
const FMT = [
  'You are writing rich, CLICKABLE reference entries for frontend/web jargon that the deck uses but never defines — a curious learner will click these to finally understand them. For EACH term below, produce one complete entry. If a listed token is NOT genuine technical jargon (a stray common word), OMIT it.',
  '',
  'Each entry:',
  '- key: kebab-case unique id (e.g. "wcag", "aria", "cors", "core-web-vitals" — for an acronym use the lowercased acronym).',
  '- term: the canonical display name — usually the acronym itself (e.g. "WCAG", "ARIA", "CORS").',
  '- aliases: the FULL expansion plus common variants/spellings, so the term links wherever EITHER form appears (e.g. ["Web Content Accessibility Guidelines"]). Include the expansion always.',
  '- group: the single best-fit topic code from ' + FE_TOPICS + '.',
  '- eli5: ONE plain-English sentence — what it is.',
  '- memory: a short hook to remember the acronym/expansion.',
  '- full: 2-3 HTML paragraphs covering, explicitly: (1) WHAT it is, (2) its HISTORY / ORIGIN — who created it and roughly when, and key versions/milestones, (3) its PURPOSE, and (4) WHY IT IS STILL USED today (or what replaced it). Be specific and CORRECT (e.g. WCAG: published by the W3C\'s WAI; 1.0 in 1999, 2.0 in 2008, 2.1 in 2018, 2.2 in 2023; conformance levels A/AA/AAA).',
  '- worked: a concrete example or short code/markup snippet showing it in action (HTML; escape any literal tags as &lt;tag&gt;).',
  '- teach: a ground-up "Teach me from the ground up" explanation, SAME style as the deck (open with "At its core, X is just…", a concrete analogy in <div class="analogy">…</div>, a takeaway in <div class="key">…</div>, ~300-450 words HTML).',
  '- related: kebab keys of sibling terms in this set.',
  '',
  'HTML only for full/worked/teach (<p>,<strong>,<em>,<code>,<ul>,<li>,<h4>). You may use $…$ for math. Current as of 2026. NEVER invent dates, versions, or authors — if unsure of a historical detail, describe it qualitatively instead of stating a wrong fact.'
].join('\n');

// batches of ~11
const BATCH = 11, batches = [];
for (let i = 0; i < TERMS.length; i += BATCH) batches.push({ id: (i / BATCH) | 0, terms: TERMS.slice(i, i + BATCH) });

const meta = { name: 'frontend-jargon', description: 'Define & make clickable the frontend acronyms/jargon the deck uses but never expands', phases: [{ title: 'Define', detail: 'one agent per batch' }] };
const ENTRY = '{type:"object",additionalProperties:false,required:["key","term","group","eli5","full","teach"],properties:{key:{type:"string"},term:{type:"string"},aliases:{type:"array",items:{type:"string"}},group:{type:"string"},eli5:{type:"string"},memory:{type:"string"},full:{type:"string"},worked:{type:"string"},teach:{type:"string"},related:{type:"array",items:{type:"string"}}}}';
const script =
  'export const meta = ' + JSON.stringify(meta) + ';\n' +
  'const BATCHES = ' + JSON.stringify(batches) + ';\n' +
  'const OUT={type:"object",additionalProperties:false,required:["entries"],properties:{entries:{type:"array",items:' + ENTRY + '}}};\n' +
  'const FMT=' + JSON.stringify(FMT) + ';\n' +
  'const res = await parallel(BATCHES.map(b => () => agent("Define these frontend jargon terms.\\n\\n"+FMT+"\\n\\nTERMS (with how the deck uses each):\\n"+JSON.stringify(b.terms), {label:"jargon:"+b.id, phase:"Define", effort:"high", schema:OUT})));\n' +
  'return { batches: res.filter(Boolean) };\n';
fs.writeFileSync(OUT, script);
console.log('wrote ' + OUT + '\n terms: ' + TERMS.length + ' | batches: ' + batches.length + ' | withContext: ' + TERMS.filter(t => t.uses.length).length);
