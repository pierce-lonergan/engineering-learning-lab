#!/usr/bin/env node
/* Assemble a "Teach me from the ground up" wave into ENHANCE modules.
 *   node scripts/assemble_teach.js <wave-output.json> [prefix=30]
 * Input result.topics[] = { code, items:[{key, teach}] }. Emits content/<prefix>-teach-<code>.js
 * containing enh({ key:{teach}, ... }) so the teaching HTML is merged onto the EXISTING glossary
 * entry at load time (engine applies ENHANCE over GLOSSARY). Only keys that already exist are
 * written (so we never fabricate a term). Literal <script>/<style> tags in the teaching HTML are
 * escaped to entities so they render as text. */
const fs = require('fs'), path = require('path');
const SRC = process.argv[2], PREFIX = process.argv[3] || '30';
if (!SRC) { console.error('usage: node scripts/assemble_teach.js <wave-output.json> [prefix]'); process.exit(2); }
const CONTENT = path.join(__dirname, '..', 'content');

// learn existing glossary keys
const GLOSSARY_DATA = {}, CARDS_DATA = [], SECTIONS_DATA = {}, DECKS_DATA = [], ENHANCE = {}, QUIZ_DATA = [];
function enh(o) { for (const k in o) ENHANCE[k] = Object.assign(ENHANCE[k] || {}, o[k]); }
const stub = () => '';
const PARAMS = ['GLOSSARY_DATA','CARDS_DATA','SECTIONS_DATA','DECKS_DATA','ENHANCE','enh','QUIZ_DATA','CODE','TABLE','CONSOLE','HIGHLIGHT','SEQUENCE','BOXES','DIAGRAM'];
const ARGS = [GLOSSARY_DATA,CARDS_DATA,SECTIONS_DATA,DECKS_DATA,ENHANCE,enh,QUIZ_DATA,stub,stub,stub,stub,stub,stub,stub];
for (const f of fs.readdirSync(CONTENT).filter(f => f.endsWith('.js')).sort()) {
  try { new Function(...PARAMS, fs.readFileSync(path.join(CONTENT, f), 'utf8'))(...ARGS); } catch (e) {}
}
const known = new Set(Object.keys(GLOSSARY_DATA));

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const topics = (raw.result && raw.result.topics) || raw.topics;
if (!Array.isArray(topics)) throw new Error('no result.topics[] in ' + SRC);
const safe = s => String(s).replace(/<(\/?)(script|style)(\s|>|$)/gi, '&lt;$1$2$3');

let files = 0, total = 0, skipped = 0, empty = 0;
topics.forEach(t => {
  if (!t || !t.code || !Array.isArray(t.items)) return;
  const entries = [];
  t.items.forEach(it => {
    if (!it || !it.key || !it.teach || typeof it.teach !== 'string' || it.teach.length < 80) { empty++; return; }
    const key = String(it.key).trim();
    if (!known.has(key)) { skipped++; return; }
    entries.push('  ' + JSON.stringify(key) + ': ' + JSON.stringify({ teach: safe(it.teach) }));
  });
  if (!entries.length) return;
  const fname = PREFIX + '-teach-' + t.code.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.js';
  const out = '/* Teach me from the ground up: ' + t.code + ' (auto-assembled) */\nenh({\n' + entries.join(',\n') + '\n});\n';
  fs.writeFileSync(path.join(CONTENT, fname), out, 'utf8');
  files++; total += entries.length;
});
console.log('teach modules: ' + files + ' | concepts enhanced: ' + total + ' | unknown-key skipped: ' + skipped + ' | empty/short skipped: ' + empty);
