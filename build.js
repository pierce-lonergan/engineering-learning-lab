#!/usr/bin/env node
/* Build the single-file, offline Engineering Learning Lab.
 * Reads src/engine.html, injects every content/*.js module at <!-- @CONTENT@ -->,
 * writes index.html, then validates that all cross-link ids resolve. */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const ENGINE = path.join(ROOT, 'src', 'engine.html');
const CONTENT_DIR = path.join(ROOT, 'content');
const OUT = path.join(ROOT, 'index.html');
const MARKER = '<!-- @CONTENT@ -->';

function build() {
  const engine = fs.readFileSync(ENGINE, 'utf8');
  if (engine.indexOf(MARKER) < 0) throw new Error('content marker not found in engine.html');

  const files = fs.existsSync(CONTENT_DIR)
    ? fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.js')).sort()
    : [];

  let injected = '';
  for (const f of files) {
    const code = fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8')
      .replace(/<\/(script)/gi, '<\\/$1');   // neutralize any literal </script> in content strings so it can't close the inline tag early (runtime string value is unchanged: \/ === /)
    injected += '\n<!-- content: ' + f + ' -->\n<script>\n' + code + '\n</script>\n';
  }

  const html = engine.replace(MARKER, injected);
  fs.writeFileSync(OUT, html, 'utf8');

  // ---- validate ----
  const report = validate(html);
  console.log('Built index.html  (' + (html.length / 1024).toFixed(0) + 'KB, ' + files.length + ' content modules)');
  console.log('  cards: ' + report.cards + ' | glossary: ' + report.glossary + ' | quiz: ' + report.quiz + ' | graphics: ' + report.graphics);
  if (report.syntaxErrors.length) { console.log('  SYNTAX ERRORS:'); report.syntaxErrors.forEach(e => console.log('    ' + e)); }
  if (report.deadRelated.length) { console.log('  DEAD related links (' + report.deadRelated.length + '):'); report.deadRelated.slice(0, 40).forEach(e => console.log('    ' + e)); }
  if (report.deadGraphics.length) { console.log('  DEAD graphic refs (' + report.deadGraphics.length + '):'); report.deadGraphics.forEach(e => console.log('    ' + e)); }
  if (report.badSec.length) { console.log('  CARDS with unknown sec (' + report.badSec.length + '):'); [...new Set(report.badSec)].slice(0, 20).forEach(e => console.log('    ' + e)); }
  const ok = !report.syntaxErrors.length && !report.deadRelated.length && !report.deadGraphics.length;
  console.log(ok ? '  ✓ all cross-links resolve' : '  ✗ validation found issues');
  return ok;
}

function validate(html) {
  const r = { cards: 0, glossary: 0, quiz: 0, graphics: 0, syntaxErrors: [], deadRelated: [], deadGraphics: [], badSec: [] };
  // content uses CODE/TABLE/CONSOLE/HIGHLIGHT helpers; stub them so data evals
  const S = function () { return ''; };
  const H = ['CODE', 'TABLE', 'CONSOLE', 'HIGHLIGHT', 'SEQUENCE', 'BOXES', 'DIAGRAM'];
  const args = H.map(() => S);
  const ev = (code) => new Function(...H, 'return (' + code + ')')(...args);
  const evArr = (code) => new Function(...H, 'return [' + code + ']')(...args);
  // syntax-check every inline script
  const sre = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g; let m, i = 0;
  while ((m = sre.exec(html))) {
    if (/src=/.test(m[0])) continue;
    const c = m[1].trim(); if (!c) continue; i++;
    try { new Function(c); } catch (e) { r.syntaxErrors.push('script#' + i + ': ' + e.message.slice(0, 120)); }
  }
  // registered graphics
  const gfx = new Set(); let g; const gre = /GRAPHICS\[['"]([a-z0-9-]+)['"]\]\s*=/g;
  while ((g = gre.exec(html))) gfx.add(g[1]);
  r.graphics = gfx.size;
  // sections
  const SECTIONS = {};
  let s; const sse = /SECTIONS_DATA\[['"]([A-Za-z0-9_-]+)['"]\]\s*=/g; while ((s = sse.exec(html))) SECTIONS[s[1]] = 1;
  const seo = /Object\.assign\(SECTIONS_DATA,\s*(\{[\s\S]*?\n\}\))\s*\)?;/g; let so;
  while ((so = seo.exec(html))) { try { Object.assign(SECTIONS, ev(so[1].replace(/\)$/, ''))); } catch (e) {} }
  // glossary (Object.assign(GLOSSARY_DATA, {...}))
  const G = {}; const are = /Object\.assign\(GLOSSARY_DATA,\s*(\{[\s\S]*?\n\}\))\s*\)?;/g; let a;
  while ((a = are.exec(html))) { try { Object.assign(G, ev(a[1].replace(/\)$/, ''))); } catch (e) {} }
  r.glossary = Object.keys(G).length;
  // enh overlay (so related on enh-only entries still validates)
  const E = {}; const ere = /(?:^|\W)enh\((\{[\s\S]*?\n\}\))\s*\)?;/g; let e2;
  while ((e2 = ere.exec(html))) { try { const o = ev(e2[1].replace(/\)$/, '')); for (const k in o) E[k] = Object.assign(E[k] || {}, o[k]); } catch (e) {} }
  const ids = new Set([...Object.keys(G), ...Object.keys(E)]);
  // cards
  const cre = /CARDS_DATA\.push\(([\s\S]*?)\n\s*\);/g; let c2;
  while ((c2 = cre.exec(html))) { try { const arr = evArr(c2[1]); arr.forEach(card => { r.cards++; if (card && card.sec && !SECTIONS[card.sec]) r.badSec.push(card.sec); }); } catch (e) {} }
  // quiz count
  const qre = /QUIZ_DATA\.push\(([\s\S]*?)\n\s*\);/g; let q2;
  while ((q2 = qre.exec(html))) { try { r.quiz += evArr(q2[1]).length; } catch (e) {} }
  // dead-link checks
  for (const id of ids) {
    const e = Object.assign({}, G[id] || {}, E[id] || {});
    (e.related || []).forEach(rel => { if (!ids.has(rel)) r.deadRelated.push(id + ' -> ' + rel); });
    if (e.graphic && !gfx.has(e.graphic)) r.deadGraphics.push(id + ' -> ' + e.graphic);
    (e.examples || []).forEach(x => { if (x && x.graphicId && !gfx.has(x.graphicId)) r.deadGraphics.push(id + ' (example) -> ' + x.graphicId); });
  }
  return r;
}

const ok = build();
process.exit(ok ? 0 : 1);
