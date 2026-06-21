#!/usr/bin/env node
/* Assemble a content wave into engine content modules — wave-safe across the whole repo.
 *
 *   node scripts/assemble_wave.js <task-output.json> <file-prefix>
 *
 * Input: a Workflow task-output JSON whose result.topics[] is
 *   { code, name, cards:[{front,back}], glossary:[{key,term,aliases,eli5,memory,full,trap,worked,related}] }
 * Output: content/<prefix>-<code>.js per topic, with CARDS_DATA.push + Object.assign(GLOSSARY_DATA,...).
 *
 * Safety: evaluates the EXISTING content modules to learn every already-defined glossary key and
 * card front, so this wave never redefines a prior concept (first/earlier wave wins, links still
 * resolve to it) and duplicate fronts are reported against the entire deck set. Escaping-safe
 * (JSON.stringify). Stamps sec/group = topic code, prunes dead `related` links.
 */
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2];
const PREFIX = process.argv[3];
if (!SRC || !PREFIX) { console.error('usage: node scripts/assemble_wave.js <task-output.json> <file-prefix>'); process.exit(2); }
const CONTENT = path.join(__dirname, '..', 'content');

// ---- 1) learn existing glossary keys + card fronts by evaluating current modules ----
const GLOSSARY_DATA = {}, CARDS_DATA = [], SECTIONS_DATA = {}, DECKS_DATA = [], ENHANCE = {}, QUIZ_DATA = [];
function enh(o) { for (const k in o) ENHANCE[k] = Object.assign(ENHANCE[k] || {}, o[k]); }
const stub = () => '';
const PARAMS = ['GLOSSARY_DATA', 'CARDS_DATA', 'SECTIONS_DATA', 'DECKS_DATA', 'ENHANCE', 'enh', 'QUIZ_DATA',
                'CODE', 'TABLE', 'CONSOLE', 'HIGHLIGHT', 'SEQUENCE', 'BOXES', 'DIAGRAM'];
const ARGS = [GLOSSARY_DATA, CARDS_DATA, SECTIONS_DATA, DECKS_DATA, ENHANCE, enh, QUIZ_DATA,
              stub, stub, stub, stub, stub, stub, stub];
for (const f of fs.readdirSync(CONTENT).filter(f => f.endsWith('.js')).sort()) {
  const code = fs.readFileSync(path.join(CONTENT, f), 'utf8');
  try { new Function(...PARAMS, code)(...ARGS); }
  catch (e) { console.error('warn: could not eval ' + f + ': ' + e.message); }
}
const known = new Set(Object.keys(GLOSSARY_DATA));
const frontOwner = new Map();
CARDS_DATA.forEach(c => { if (c && c.front) frontOwner.set(String(c.front).trim().toLowerCase(), c.sec || '?'); });
console.log('existing: ' + known.size + ' glossary keys, ' + CARDS_DATA.length + ' cards');

// ---- 2) load the new wave ----
const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const topics = (raw.result && raw.result.topics) || raw.topics;
if (!Array.isArray(topics)) throw new Error('no result.topics[] in ' + SRC);

const dupKeys = [], dupFronts = [];
let prunedRelated = 0;

// pass 1: keep glossary entries (skip keys already defined anywhere), stamp group
topics.forEach(t => {
  t._gloss = [];
  (t.glossary || []).forEach(g => {
    if (!g || !g.key || !g.term) return;
    const key = String(g.key).trim();
    if (known.has(key)) { dupKeys.push(key + ' <' + t.code + '>'); return; }
    known.add(key);
    t._gloss.push(g);
  });
});
// pass 2: prune dead related refs (resolve against the full known set)
topics.forEach(t => t._gloss.forEach(g => {
  const before = Array.isArray(g.related) ? g.related.length : 0;
  g.related = (Array.isArray(g.related) ? g.related : []).filter(r => known.has(r));
  prunedRelated += before - g.related.length;
}));
// pass 3: cards — stamp sec, detect dup fronts across the whole deck set
topics.forEach(t => {
  t._cards = [];
  (t.cards || []).forEach(c => {
    if (!c || !c.front || !c.back) return;
    const fk = String(c.front).trim().toLowerCase();
    if (frontOwner.has(fk)) dupFronts.push(c.front + ' (' + t.code + ' & ' + frontOwner.get(fk) + ')');
    else frontOwner.set(fk, t.code);
    t._cards.push({ sec: t.code, front: c.front, back: c.back });
  });
});

// ---- 3) emit ----
let files = 0, totalCards = 0, totalGloss = 0;
topics.forEach(t => {
  if (!t.code) return;
  const fname = PREFIX + '-' + t.code.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.js';
  let out = '/* ' + t.name + ' (' + t.code + ') — fact-checked content wave (auto-assembled) */\n';
  out += 'CARDS_DATA.push(\n' + t._cards.map(c => '  ' + JSON.stringify(c)).join(',\n') + '\n);\n\n';
  out += 'Object.assign(GLOSSARY_DATA, {\n' + t._gloss.map(g => {
    const e = { term: g.term, group: t.code };
    if (g.aliases && g.aliases.length) e.aliases = g.aliases;
    e.eli5 = g.eli5 || '';
    if (g.memory) e.memory = g.memory;
    e.full = g.full || '';
    if (g.trap) e.trap = g.trap;
    if (g.worked) e.worked = g.worked;
    if (g.related && g.related.length) e.related = g.related;
    return '  ' + JSON.stringify(String(g.key).trim()) + ': ' + JSON.stringify(e);
  }).join(',\n') + '\n});\n';
  fs.writeFileSync(path.join(CONTENT, fname), out, 'utf8');
  files++; totalCards += t._cards.length; totalGloss += t._gloss.length;
});

console.log('assembled ' + files + ' modules | ' + totalCards + ' cards | ' + totalGloss + ' glossary');
console.log('dup glossary keys skipped (already defined): ' + dupKeys.length + (dupKeys.length ? '  [' + dupKeys.slice(0, 30).join(', ') + ']' : ''));
console.log('dead related links pruned: ' + prunedRelated);
console.log('duplicate fronts: ' + dupFronts.length + (dupFronts.length ? '\n  - ' + dupFronts.slice(0, 30).join('\n  - ') : ''));
