#!/usr/bin/env node
/* Assemble the Foundations content wave into engine content modules.
 * Input: the Workflow task-output JSON (argv[2]) containing result.topics[] of
 *   { code, name, cards:[{front,back}], glossary:[{key,term,aliases,eli5,memory,full,trap,worked,related}] }
 * Output: content/10-<code>.js per topic, with CARDS_DATA.push + Object.assign(GLOSSARY_DATA,...).
 * Deterministic + escaping-safe (JSON.stringify). Dedups glossary keys (demo wins),
 * prunes dead `related` refs, sets sec/group = topic code, reports duplicate fronts.
 */
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2];
if (!SRC) { console.error('usage: node scripts/assemble_foundations.js <task-output.json>'); process.exit(2); }
const CONTENT = path.join(__dirname, '..', 'content');

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const topics = (raw.result && raw.result.topics) || raw.topics;
if (!Array.isArray(topics)) throw new Error('no result.topics[] in ' + SRC);

// demo glossary keys already defined in content/00-demo.js — keep them canonical
const DEMO_KEYS = ['dual-write-problem', 'transactional-outbox', 'idempotency', 'exactly-once', 'dead-letter-queue', 'change-data-capture'];
const known = new Set(DEMO_KEYS);
const dupKeys = [];

// pass 1: keep glossary entries, first-key-wins, stamp group = topic code
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

// pass 2: prune dead related refs (anything not resolving to a kept/demo key)
let prunedRelated = 0;
topics.forEach(t => t._gloss.forEach(g => {
  const before = Array.isArray(g.related) ? g.related.length : 0;
  g.related = (Array.isArray(g.related) ? g.related : []).filter(r => known.has(r));
  prunedRelated += before - g.related.length;
}));

// pass 3: cards — stamp sec, detect duplicate fronts across the whole deck
const frontOwner = new Map();
const dupFronts = [];
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

// emit
let files = 0, totalCards = 0, totalGloss = 0;
topics.forEach(t => {
  if (!t.code) return;
  const fname = '10-' + t.code.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.js';
  let out = '/* Foundations · ' + t.name + ' (' + t.code + ') — fact-checked content wave (auto-assembled) */\n';
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
console.log('dup glossary keys skipped: ' + dupKeys.length + (dupKeys.length ? '  [' + dupKeys.slice(0, 25).join(', ') + ']' : ''));
console.log('dead related links pruned: ' + prunedRelated);
console.log('duplicate fronts (cosmetic, exam distractors): ' + dupFronts.length + (dupFronts.length ? '\n  - ' + dupFronts.slice(0, 30).join('\n  - ') : ''));
