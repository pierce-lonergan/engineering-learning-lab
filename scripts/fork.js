// One-time fork: extract the reusable engine from the Series 65 lab,
// stripping finance graphics (293-1088) and all finance content (1654-5632).
const fs = require('fs');
const SRC = 'C:/Users/Pierce Lonergan/Documents/GitHub/series-65-learning-lab/index.html';
const DST = 'C:/Users/Pierce Lonergan/Documents/GitHub/engineering-learning-lab/src/engine.html';
const L = fs.readFileSync(SRC, 'utf8').split('\n');
const slice = (a, b) => L.slice(a - 1, b).join('\n'); // 1-indexed inclusive

const head = slice(1, 289); // head + markup + script open + DATA STORES + GRAPHICS{} + usd + svgEl
const gfx =
  '\n/* ============================================================================\n' +
  '   SWE INTERACTIVE GRAPHICS  (sequence/boxes factories + concept widgets)\n' +
  '   added during engine adaptation\n' +
  '   ============================================================================ */\n';
const engine = slice(1089, 1652); // AUTO-LINKER ... renderers ... modes ... exam ... boot() ... </script>
const data = [
  '',
  '<!-- ============================================================================',
  '     DATA PAYLOAD  — content modules are injected by build.js at the marker below',
  '     ============================================================================ -->',
  '<script>',
  'const SECTIONS_DATA = {};   // topicCode -> display name',
  'const DECKS_DATA = [];      // [{id,name,topics:[topicCode,...]}] for two-level nav',
  'const CARDS_DATA = [];',
  'const GLOSSARY_DATA = {};',
  'const ENHANCE = {};',
  'function enh(o){ for(const k in o){ ENHANCE[k]=Object.assign(ENHANCE[k]||{}, o[k]); } }',
  'const QUIZ_DATA = [];',
  '</script>',
  '',
  '<!-- @CONTENT@ -->',
  ''
].join('\n');
const tail = slice(5633, 5635); // <script>boot();</script> </body> </html>

const out = head + gfx + '\n' + engine + '\n' + data + '\n' + tail + '\n';
fs.writeFileSync(DST, out, 'utf8');

const nl = out.split('\n').length;
console.log('engine.html written:', (out.length / 1024).toFixed(0) + 'KB', nl, 'lines');

// syntax-check inline scripts
const re = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g;
let m, i = 0, errs = 0;
while ((m = re.exec(out))) {
  if (/src=/.test(m[0])) continue;
  const c = m[1].trim();
  if (!c) continue;
  i++;
  try { new Function(c); } catch (e) { errs++; console.log('script#' + i + ' ERR:', e.message.slice(0, 110)); }
}
console.log('inline scripts:', i, 'syntax errors:', errs);
