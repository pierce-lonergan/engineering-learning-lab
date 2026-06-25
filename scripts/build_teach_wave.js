#!/usr/bin/env node
/* Build a "Teach me from the ground up" workflow script for one deck.
 *   node scripts/build_teach_wave.js <deckId> <out-workflow-path>
 * Evaluates all content modules, groups the deck's glossary by topic (skipping any
 * already-taught), and emits a self-contained workflow script (one agent per topic,
 * each authoring a ground-up `teach` HTML for every concept, grounded in its existing
 * eli5/full/trap/worked). Run the workflow, then assemble_teach.js the result. */
const fs = require('fs'), path = require('path');
const deckId = process.argv[2], OUT = process.argv[3];
if (!deckId || !OUT) { console.error('usage: node scripts/build_teach_wave.js <deckId> <out-path>'); process.exit(2); }

const GLOSSARY_DATA = {}, CARDS_DATA = [], SECTIONS_DATA = {}, DECKS_DATA = [], ENHANCE = {}, QUIZ_DATA = [];
function enh(o) { for (const k in o) ENHANCE[k] = Object.assign(ENHANCE[k] || {}, o[k]); }
const stub = () => '';
const PARAMS = ['GLOSSARY_DATA','CARDS_DATA','SECTIONS_DATA','DECKS_DATA','ENHANCE','enh','QUIZ_DATA','CODE','TABLE','CONSOLE','HIGHLIGHT','SEQUENCE','BOXES','DIAGRAM'];
const ARGS = [GLOSSARY_DATA,CARDS_DATA,SECTIONS_DATA,DECKS_DATA,ENHANCE,enh,QUIZ_DATA,stub,stub,stub,stub,stub,stub,stub];
const CONTENT = path.join(__dirname, '..', 'content');
for (const f of fs.readdirSync(CONTENT).filter(f => f.endsWith('.js')).sort()) {
  try { new Function(...PARAMS, fs.readFileSync(path.join(CONTENT, f), 'utf8'))(...ARGS); } catch (e) { console.error('warn eval ' + f + ': ' + e.message); }
}
for (const id in ENHANCE) { if (GLOSSARY_DATA[id]) Object.assign(GLOSSARY_DATA[id], ENHANCE[id]); }

const deck = DECKS_DATA.find(d => d.id === deckId);
if (!deck) { console.error('no deck: ' + deckId); process.exit(2); }
const topicSet = new Set(deck.topics);
const byTopic = {};
for (const key in GLOSSARY_DATA) { const g = GLOSSARY_DATA[key];
  if (!topicSet.has(g.group) || g.teach) continue;
  (byTopic[g.group] = byTopic[g.group] || []).push({ key, term: g.term, eli5: g.eli5 || '', full: g.full || '', trap: g.trap || '', worked: g.worked || '' });
}
const TOPICS = deck.topics.filter(t => byTopic[t] && byTopic[t].length).map(t => ({ code: t, name: SECTIONS_DATA[t] || t, terms: byTopic[t] }));

const FMT = [
  'You are a world-class engineering teacher writing the "Teach me from the ground up" explanation for each concept below. For EACH concept return { key, teach } where `teach` is rich HTML that teaches it from scratch to a motivated learner who has never seen it.',
  '',
  'STYLE (like the clearest tutorial you have ever read):',
  '- Open with a plain-language hook: "At its core, X is just …" — zero jargon in the first sentence.',
  '- Then BUILD intuition step by step. Explain what each part/term/symbol means in everyday language. If there is a formal definition or formula, DECONSTRUCT it facet by facet ("Let us dissect that scary sentence…"), translating each piece into plain English and what it means in the real world.',
  '- Use at least one concrete ANALOGY — wrap each in <div class="analogy">…</div>.',
  '- Explain WHY it works and WHY it matters in practice (and when it bites).',
  '- End by surfacing the single most important takeaway — wrap it in <div class="key">…</div>.',
  '',
  'FORMAT: HTML only — <p>, <h4> for sub-headings, <ul>/<li>, <code> for code/symbols/identifiers, <strong> for emphasis. You may use $…$ for math (rendered by MathJax). ~350-550 words per concept. Warm, clear, second-person ("you"), never condescending, never padded.',
  '',
  'GROUNDING (critical): each concept ships with its definition (eli5/full), gotcha (trap), and worked example. Your explanation MUST be consistent with and ILLUMINATE that material — expand it with intuition and analogies, but NEVER contradict it or invent incorrect facts. Keep everything technically correct for a senior engineering interview, current as of 2026.',
  '',
  'Return EXACTLY one item per provided key, reusing the SAME key string verbatim.'
].join('\n');

const meta = { name: 'teach-' + deckId, description: 'Ground-up "Teach me" explanations for ' + deck.name, phases: [{ title: 'Teach', detail: 'one agent per topic' }] };
const script =
  'export const meta = ' + JSON.stringify(meta) + ';\n' +
  'const TOPICS = ' + JSON.stringify(TOPICS) + ';\n' +
  'const S=(e)=>({type:"object",additionalProperties:false,...e});\n' +
  'const ITEM=S({required:["key","teach"],properties:{key:{type:"string"},teach:{type:"string",description:"ground-up teaching HTML"}}});\n' +
  'const OUT=S({required:["code","items"],properties:{code:{type:"string"},items:{type:"array",items:ITEM}}});\n' +
  'const FMT=' + JSON.stringify(FMT) + ';\n' +
  'const res = await pipeline(TOPICS, (t)=> agent("Topic: "+t.name+" ("+t.code+").\\n\\n"+FMT+"\\n\\nCONCEPTS (one item per key):\\n"+JSON.stringify(t.terms), {label:"teach:"+t.code, phase:"Teach", effort:"high", schema:OUT}));\n' +
  'return { deck:' + JSON.stringify(deckId) + ', topics: res.filter(Boolean) };\n';

fs.writeFileSync(OUT, script);
console.log('wrote ' + OUT + '\n topics: ' + TOPICS.length + ' | concepts: ' + TOPICS.reduce((n, t) => n + t.terms.length, 0));
