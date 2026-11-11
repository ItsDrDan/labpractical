// Load a Station Rotation index.html (any version) into jsdom and expose its globals.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
function load(dir, url) {
  let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const cls = path.join(dir, 'classes.js');
  html = html.replace(/<script src="classes\.js"><\/script>/, fs.existsSync(cls) ? `<script>${fs.readFileSync(cls, 'utf8')}</script>` : '');
  html = html.replace(/<script src="https?:[^"]*"[^>]*><\/script>/g, '');
  // expose top-level const/let by appending an exporter to the main inline script
  html = html.replace(/<\/script>(?![\s\S]*<\/script>)/, `;try{window.__X={LABS:typeof LABS!=='undefined'?LABS:null,makeQ:typeof makeQ!=='undefined'?makeQ:null,famOf:typeof famOf!=='undefined'?famOf:null,FAM:typeof FAM!=='undefined'?FAM:null,buildPractical:typeof buildPractical!=='undefined'?buildPractical:null,getMock:()=>typeof mock!=='undefined'?mock:null,HANDS:typeof HANDS!=='undefined'?HANDS:null,P:()=>typeof P!=='undefined'?P:null,gradePart:typeof gradePart!=='undefined'?gradePart:null,DAN_LABS:typeof DAN_LABS!=='undefined'?DAN_LABS:null,SECTIONS:typeof SECTIONS!=='undefined'?SECTIONS:null,WRONG_WHY:typeof WRONG_WHY!=='undefined'?WRONG_WHY:null}}catch(e){window.__XERR=String(e)}</script>`);
  const errors = [];
  const vc = new (require('jsdom').VirtualConsole)();
  vc.on('jsdomError', e => errors.push(String(e.message || e)));
  const dom = new JSDOM(html, { runScripts: 'dangerously', url: url || 'https://itsdrdan.github.io/labpractical/', virtualConsole: vc, pretendToBeVisual: true,
    beforeParse(w) { w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} }); w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {}; w.fetch = () => Promise.reject('nofetch'); } });
  const X = dom.window.__X; if (!X) throw new Error('export failed ' + dom.window.__XERR + ' ' + errors.slice(0, 3).join(' | '));
  X.window = dom.window; X.errors = errors; return X;
}
module.exports = load;
