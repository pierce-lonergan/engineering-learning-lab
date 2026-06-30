#!/usr/bin/env node
/* Extract a deck's cards (in deck order) as clean SPOKEN text for TTS episode generation.
 *   node scripts/extract_audio_text.js <deckId> <out.json>
 * Output: { deck, cards:[{front, sec, topic, q, a, aKey}] }  (q/a = speech-normalized question/answer). */
const fs = require('fs'), path = require('path');
const DECK = process.argv[2], OUT = process.argv[3];
if (!DECK || !OUT) { console.error('usage: node scripts/extract_audio_text.js <deckId> <out.json>'); process.exit(2); }

const GLOSSARY_DATA = {}, CARDS_DATA = [], SECTIONS_DATA = {}, DECKS_DATA = [], ENHANCE = {}, QUIZ_DATA = [];
function enh(o) { for (const k in o) ENHANCE[k] = Object.assign(ENHANCE[k] || {}, o[k]); }
const stub = () => '';
const P = ['GLOSSARY_DATA','CARDS_DATA','SECTIONS_DATA','DECKS_DATA','ENHANCE','enh','QUIZ_DATA','CODE','TABLE','CONSOLE','HIGHLIGHT','SEQUENCE','BOXES','DIAGRAM'];
const A = [GLOSSARY_DATA,CARDS_DATA,SECTIONS_DATA,DECKS_DATA,ENHANCE,enh,QUIZ_DATA,stub,stub,stub,stub,stub,stub,stub];
const C = path.join(__dirname, '..', 'content');
for (const f of fs.readdirSync(C).filter(f => f.endsWith('.js')).sort()) { try { new Function(...P, fs.readFileSync(path.join(C, f), 'utf8'))(...A); } catch (e) {} }

const deck = DECKS_DATA.find(d => d.id === DECK);
if (!deck) { console.error('no deck: ' + DECK); process.exit(2); }
const order = (deck.topics || []);
const rank = {}; order.forEach((t, i) => rank[t] = i);

// HTML -> spoken text (ports engine htmlToSpeech, with manual entity decode for Node)
function htmlToSpeech(html) {
  let s = String(html || '');
  s = s.replace(/<li[^>]*>/gi, ' ').replace(/<\/(li|p|div|h[1-4]|tr|ul|ol)>/gi, '. ').replace(/<br\s*\/?>/gi, '. ').replace(/<[^>]+>/g, ' ');
  s = s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&rsquo;|&apos;/g, "'")
       .replace(/&ldquo;|&rdquo;/g, '"').replace(/&rarr;|&harr;|&hArr;/g, ' to ').replace(/&middot;|&bull;/g, '. ').replace(/&mdash;|&ndash;/g, ', ')
       .replace(/&nbsp;/g, ' ').replace(/&hellip;/g, '...').replace(/&times;/g, ' times ').replace(/&asymp;/g, ' about ').replace(/&[a-z]+;/gi, ' ');
  s = s.replace(/\bT\s*\+\s*([012])\b/g, 'T plus $1').replace(/(\d)\s*=\s*([A-Za-z0-9])/g, '$1 equals $2')
       .replace(/\bP&L\b/g, 'P and L').replace(/\s*&\s*/g, ' and ').replace(/\s*=\s*/g, ' equals ').replace(/([A-Za-z0-9])\/([A-Za-z0-9])/g, '$1 or $2')
       .replace(/\bvs\.?\b/gi, 'versus').replace(/\be\.g\.?,?/gi, 'for example,').replace(/\bi\.e\.?,?/gi, 'that is,')
       .replace(/[→↦⇒»]/g, ' to ').replace(/\$(\d)/g, '$1 dollars').replace(/(\d)%/g, '$1 percent').replace(/_{3,}/g, ' blank ');
  return s.replace(/[`*#>|]/g, ' ').replace(/\s*\.(\s*\.)+/g, '. ').replace(/\s+/g, ' ').trim();
}
function firstSentence(txt) { const m = txt.match(/^.*?[.:!?](\s|$)/); let s = m ? m[0] : txt; if (s.length < 45) s = txt.slice(0, 220); return s.trim(); }

const cards = CARDS_DATA.filter(c => c && rank[c.sec] !== undefined)
  .sort((a, b) => (rank[a.sec] - rank[b.sec]))   // stable: keeps within-topic file order
  .map(c => { const a = htmlToSpeech(c.back); return { front: c.front, sec: c.sec, topic: SECTIONS_DATA[c.sec] || c.sec, q: htmlToSpeech(c.front), a: a, aKey: firstSentence(a) }; });

fs.writeFileSync(OUT, JSON.stringify({ deck: DECK, name: deck.name, count: cards.length, cards }));
console.log('wrote ' + OUT + ' | ' + cards.length + ' cards | topics: ' + order.length);
