#!/usr/bin/env node
/* Assemble a "define the jargon" wave into NEW glossary entries (clickable reference terms).
 *   node scripts/assemble_jargon.js <wave-output.json> [prefix=31]
 * Input result.batches[].entries[] = {key,term,aliases,group,eli5,memory,full,worked,teach,related}.
 * Emits content/<prefix>-jargon-<group>.js with Object.assign(GLOSSARY_DATA,{...}). Safety:
 *  - skip an entry whose key OR term collides with an existing glossary key/name (never hijack a link);
 *  - drop individual aliases that collide with an existing name;
 *  - validate group is a real frontend topic; prune related links to keys that will exist;
 *  - escape literal <script>/<style> in HTML fields. */
const fs = require('fs'), path = require('path');
const SRC = process.argv[2], PREFIX = process.argv[3] || '31';
if (!SRC) { console.error('usage: node scripts/assemble_jargon.js <wave-output.json> [prefix]'); process.exit(2); }
const CONTENT = path.join(__dirname, '..', 'content');

const GLOSSARY_DATA = {}, CARDS_DATA = [], SECTIONS_DATA = {}, DECKS_DATA = [], ENHANCE = {}, QUIZ_DATA = [];
function enh(o) { for (const k in o) ENHANCE[k] = Object.assign(ENHANCE[k] || {}, o[k]); }
const stub = () => '';
const P = ['GLOSSARY_DATA','CARDS_DATA','SECTIONS_DATA','DECKS_DATA','ENHANCE','enh','QUIZ_DATA','CODE','TABLE','CONSOLE','HIGHLIGHT','SEQUENCE','BOXES','DIAGRAM'];
const A = [GLOSSARY_DATA,CARDS_DATA,SECTIONS_DATA,DECKS_DATA,ENHANCE,enh,QUIZ_DATA,stub,stub,stub,stub,stub,stub,stub];
for (const f of fs.readdirSync(CONTENT).filter(f => f.endsWith('.js')).sort()) { try { new Function(...P, fs.readFileSync(path.join(CONTENT, f), 'utf8'))(...A); } catch (e) {} }
const existingKeys = new Set(Object.keys(GLOSSARY_DATA));
const existingNames = new Set();
for (const id in GLOSSARY_DATA) { const g = GLOSSARY_DATA[id]; [g.term].concat(g.aliases || []).forEach(n => { if (n) existingNames.add(String(n).toLowerCase()); }); }
const FE_TOPICS = new Set((DECKS_DATA.find(d => d.id === 'frontend') || {}).topics || []);
const safe = s => String(s == null ? '' : s).replace(/<(\/?)(script|style)(\s|>|$)/gi, '&lt;$1$2$3');

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const batches = (raw.result && raw.result.batches) || raw.batches;
const all = [];
batches.forEach(b => (b.entries || []).forEach(e => all.push(e)));

// first pass: decide which entries we keep + their final keys (for related pruning)
const kept = []; const keptKeys = new Set(); let skipKey = 0, skipName = 0;
for (const e of all) {
  if (!e || !e.key || !e.term || !e.full) continue;
  const key = String(e.key).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  if (existingKeys.has(key) || keptKeys.has(key)) { skipKey++; continue; }
  if (existingNames.has(String(e.term).toLowerCase())) { skipName++; continue; }
  e._key = key; kept.push(e); keptKeys.add(key);
}
const willExist = new Set([...existingKeys, ...keptKeys]);

let files = 0, total = 0, droppedAlias = 0;
const byGroup = {};
for (const e of kept) {
  const group = FE_TOPICS.has(e.group) ? e.group : 'FE-HTML';
  const aliases = (Array.isArray(e.aliases) ? e.aliases : []).filter(a => a && !existingNames.has(String(a).toLowerCase()));
  droppedAlias += (Array.isArray(e.aliases) ? e.aliases.length : 0) - aliases.length;
  const entry = { term: e.term, group };
  if (aliases.length) entry.aliases = aliases;
  entry.eli5 = safe(e.eli5);
  if (e.memory) entry.memory = safe(e.memory);
  entry.full = safe(e.full);
  if (e.worked) entry.worked = safe(e.worked);
  if (e.teach) entry.teach = safe(e.teach);
  const related = (Array.isArray(e.related) ? e.related : []).map(r => String(r).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-')).filter(r => willExist.has(r) && r !== e._key);
  if (related.length) entry.related = related;
  (byGroup[group] = byGroup[group] || []).push([e._key, entry]);
}
for (const group in byGroup) {
  const fname = PREFIX + '-jargon-' + group.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.js';
  const out = '/* Frontend jargon & acronyms — clickable reference (' + group + ', auto-assembled) */\nObject.assign(GLOSSARY_DATA, {\n'
    + byGroup[group].map(([k, v]) => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(v)).join(',\n') + '\n});\n';
  fs.writeFileSync(path.join(CONTENT, fname), out, 'utf8');
  files++; total += byGroup[group].length;
}
console.log('jargon modules: ' + files + ' | terms added: ' + total + ' | skipped (key exists): ' + skipKey + ' | skipped (name collides): ' + skipName + ' | aliases dropped (collide): ' + droppedAlias);
