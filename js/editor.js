/* עורך תרחישים.
   עובד על אותו מבנה נתונים ואותו מודול ציור כמו האפליקציה, כך שמה שמסודר
   כאן נראה בדיוק כמו אצל הילד. הפלט הוא JSON — העורך לא כותב לריפו. */

import { buildPitch, createPitch, thumbnail, el, arc, trim, svgPoint } from './pitch.js';

const $ = id => document.getElementById(id);
const draftKey = id => 'k8:draft:' + id;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const HINTS = {
  select: 'גרור שחקנים, כדור, יריבים או קצוות של חיצים. לחיצה על חץ או אזור בוחרת אותו.',
  start:  'לחץ על שחקן וגרור אותו — תיפול נקודת התחלה במקום הישן וייווצר חץ ריצה אליו.',
  run:    'גרור מנקודת ההתחלה של הריצה אל היעד.',
  pass:   'גרור ממוסר הכדור אל מקבל הכדור.',
  opt:    'גרור כדי לסמן אפשרות נוספת — קו מקווקו.',
  press:  'גרור כדי לסמן תנועה של יריב.',
  opp:    'לחץ על המגרש כדי להוסיף יריב. אפשר להוסיף כמה שצריך.',
  zone:   'גרור מלבן כדי לסמן אזור, ואז כתוב לו תווית בפאנל שמתחת.',
  shadow: 'לחץ על השחקן שמכסה, ואז על הכיוון שהוא סוגר.',
  erase:  'לחץ על פריט כדי למחוק אותו. שחקן חוזר למיקום ברירת המחדל.'
};

let booklet, formations, formation, pitch, svg, overlay, gArrows;
let idx = 0, tool = 'select', sel = null, drag = null;

const scenario = () => booklet.scenarios[idx];

/* ---------- טעינה ---------- */

async function getJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

async function boot() {
  const index = await getJSON('content/booklets.json');
  formations = await getJSON('content/formations.json');
  const wanted = new URLSearchParams(location.search).get('b');
  const entry = index.booklets.find(b => b.id === wanted) || index.booklets[0];
  const publishedBooklet = await getJSON(entry.file);

  let draft = null;
  try {
    const raw = localStorage.getItem(draftKey(entry.id));
    if (raw) draft = JSON.parse(raw);
  } catch (e) { /* טיוטה פגומה — מתעלמים */ }

  booklet = draft || publishedBooklet;
  if (draft) {
    $('draft').hidden = false;
    $('draft-msg').textContent = 'נטענה טיוטה מקומית שלא פורסמה.';
  }
  $('draft-drop').onclick = () => {
    if (!confirm('לזרוק את הטיוטה ולחזור לגרסה שפורסמה?')) return;
    localStorage.removeItem(draftKey(booklet.id));
    location.reload();
  };

  formation = formations[booklet.formation];
  $('e-booklet').textContent = booklet.title;

  svg = buildPitch();
  svg.classList.add('editing');
  $('board').appendChild(svg);
  pitch = createPitch(svg, formation, booklet.role);
  gArrows = svg.querySelector('.g-arrows');
  overlay = el('g', { class: 'g-handles' });
  svg.appendChild(overlay);

  wireTools();
  wireScenarioBar();
  wireForm();
  wireExport();
  wireImport();
  wirePointer();

  fillScenarioSelect();
  load(0);
  setTool('select');

  document.documentElement.classList.remove('loading');
  $('state').style.display = 'none';
}

boot().catch(err => {
  console.error(err);
  $('state').textContent = 'לא הצלחנו לטעון את החוברת. נסו לרענן.';
});

/* ---------- שמירה ---------- */

let saveTimer = null;
function touch() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(draftKey(booklet.id), JSON.stringify(booklet)); } catch (e) { /* אחסון מלא */ }
    $('draft').hidden = false;
    $('draft-msg').textContent = 'נשמרה טיוטה מקומית. היא לא מתפרסמת עד שמורידים את הקובץ.';
  }, 400);
}

/* ---------- ציור ---------- */

function draw() {
  pitch.render(scenario(), { animate: false });
  drawHandles();
}

const HANDLE = 4.6;

function handle(x, y, data, cls = '') {
  const h = el('rect', {
    x: x - HANDLE, y: y - HANDLE, width: HANDLE * 2, height: HANDLE * 2,
    class: 'handle ' + cls
  });
  h.dataset.h = JSON.stringify(data);
  return h;
}

function bendHandle(x, y, data) {
  const h = el('circle', { cx: x, cy: y, r: HANDLE, class: 'handle bend' });
  h.dataset.h = JSON.stringify(data);
  return h;
}

function drawHandles() {
  overlay.textContent = '';
  const s = scenario();
  /* ידיות ואזורי תפיסה קיימים רק כשהם רלוונטיים. כשמציירים חץ או מסמנים
     נקודת התחלה הם רק מפריעים — הם יושבים מעל השחקנים ותופסים את הלחיצה. */
  const canSelect = tool === 'select';
  if (!canSelect && tool !== 'erase') return;

  (s.arrows || []).forEach((ar, i) => {
    /* אזור תפיסה רחב לחץ, מתחת לשחקנים כדי שלא יחסום אותם */
    const [ta, tb] = trim(ar.a, ar.b, ar.k === 'pass' ? 15 : 16, 17);
    const hit = el('path', { d: arc(ta, tb, ar.bend || 0), class: 'hit' });
    hit.dataset.arrow = i;
    gArrows.appendChild(hit);

    /* ידיות רק לחץ הנבחר */
    if (!canSelect || !sel || sel.type !== 'arrow' || sel.i !== i) return;

    const drawn = gArrows.querySelector(`path[data-arrow="${i}"]:not(.hit)`);
    if (drawn) drawn.classList.add('picked');

    overlay.appendChild(handle(ar.a[0], ar.a[1], { type: 'arrowA', i }));
    overlay.appendChild(handle(ar.b[0], ar.b[1], { type: 'arrowB', i }));
    const mid = curveMid(ar);
    overlay.appendChild(bendHandle(mid[0], mid[1], { type: 'arrowBend', i }));
  });

  (s.zones || []).forEach((z, i) => {
    if (canSelect && sel && sel.type === 'zone' && sel.i === i)
      overlay.appendChild(handle(z.x + z.w, z.y + z.h, { type: 'zoneSize', i }));
  });

  if (s.shadow && canSelect) {
    overlay.appendChild(handle(s.shadow[0][0], s.shadow[0][1], { type: 'shadowA' }));
    overlay.appendChild(handle(s.shadow[1][0], s.shadow[1][1], { type: 'shadowB' }));
  }
}

/* נקודת האמצע של הקשת עצמה: chordMid + perp*bend/2 */
function curveMid(ar) {
  const [a, b] = [ar.a, ar.b];
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  const bend = (ar.bend || 0) / 2;
  return [mx - dy / l * bend, my + dx / l * bend];
}

function bendFrom(ar, p) {
  const [a, b] = [ar.a, ar.b];
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  const px = -dy / l, py = dx / l;
  return Math.round(2 * ((p[0] - mx) * px + (p[1] - my) * py));
}

/* ---------- עכבר ומגע ---------- */

const toSvg = e => svgPoint(svg, e);

/* מה נתפס בנקודה מסוימת.
   הסדר חשוב: ידית לפני הכול כי היא נועדה לגרירה, אחר כך אובייקטים לפי
   קרבה — לא לפי מי מצויר מעל מי — ורק בסוף חיצים ואזורים. בלי זה אזור
   התפיסה הרחב של חץ בולע לחיצות על שחקן או על הכדור שיושבים עליו. */
function pick(e, p) {
  const t = e.target;
  if (t && t.dataset && t.dataset.h) return JSON.parse(t.dataset.h);

  const near = nearest(p);
  if (near) return near;

  if (t && t.dataset) {
    if (t.dataset.arrow != null) return { type: 'arrow', i: +t.dataset.arrow };
    if (t.dataset.zone != null) return { type: 'zone', i: +t.dataset.zone };
  }
  return null;
}

/* האובייקט הקרוב ביותר לנקודה, בתוך טווח נגיעה סביר.
   הכדור מצויר ברדיוס 4.6 — קטן מדי לאצבע, ולכן טווח נדיב. */
function nearest(p) {
  const s = scenario();
  let best = null, bestD = Infinity;
  const test = (pt, item, r) => {
    if (!pt) return;
    const d = Math.hypot(p[0] - pt[0], p[1] - pt[1]);
    if (d <= r && d < bestD) { bestD = d; best = item; }
  };
  /* הכדור נבדק ראשון ולכן מנצח בתיקו: הוא מצויר מעל השחקנים, ולעיתים
     קרובות יושב בדיוק על רגלי מי שמחזיק בו */
  test(s.ball, { type: 'ball' }, 14);
  formation.order.forEach(n => test((s.pos && s.pos[n]) || formation.base[n], { type: 'player', num: n }, 16));
  (s.opp || []).forEach((o, i) => test(o, { type: 'opp', i }, 14));
  (s.ghosts || []).forEach((g, i) => test(g, { type: 'ghost', i }, 13));
  return best;
}

function wirePointer() {
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const hit = pick(e, p);
    const s = scenario();
    svg.setPointerCapture(e.pointerId);

    if (tool === 'erase') { erase(hit); return; }

    if (tool === 'opp') {
      (s.opp = s.opp || []).push(p);
      commit();
      return;
    }

    if (tool === 'zone') {
      (s.zones = s.zones || []).push({ x: p[0], y: p[1], w: 1, h: 1, label: '' });
      drag = { type: 'newzone', i: s.zones.length - 1, origin: p };
      select({ type: 'zone', i: s.zones.length - 1 });
      return;
    }

    if (tool === 'shadow') {
      s.shadow = [p, [p[0], p[1] - 40]];
      drag = { type: 'shadowB' };
      commit();
      return;
    }

    if (tool === 'start') {
      if (!hit || hit.type !== 'player') return;
      const from = (s.pos && s.pos[hit.num]) || formation.base[hit.num];
      (s.ghosts = s.ghosts || []).push([from[0], from[1]]);
      (s.arrows = s.arrows || []).push({ k: 'run', a: [from[0], from[1]], b: [from[0], from[1]], bend: 0 });
      drag = { type: 'player', num: hit.num, arrow: s.arrows.length - 1 };
      commit();
      return;
    }

    if (['run', 'pass', 'opt', 'press'].includes(tool)) {
      (s.arrows = s.arrows || []).push({ k: tool, a: p, b: p, bend: 0 });
      drag = { type: 'arrowB', i: s.arrows.length - 1 };
      select({ type: 'arrow', i: s.arrows.length - 1 });
      return;
    }

    /* בחירה */
    if (!hit) { select(null); return; }
    if (hit.type === 'arrow' || hit.type === 'zone') select(hit);
    else select(null);

    if (hit.type === 'zone') drag = { type: 'zoneMove', i: hit.i, grab: p };
    else if (hit.type === 'arrow') drag = null;
    else drag = hit;
  });

  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = toSvg(e);
    const s = scenario();

    switch (drag.type) {
      case 'player':
        (s.pos = s.pos || {})[drag.num] = p;
        if (drag.arrow != null) s.arrows[drag.arrow].b = p;
        break;
      case 'ball': s.ball = p; break;
      case 'opp': s.opp[drag.i] = p; break;
      case 'ghost': s.ghosts[drag.i] = p; break;
      case 'arrowA': s.arrows[drag.i].a = p; break;
      case 'arrowB': s.arrows[drag.i].b = p; break;
      case 'arrowBend': s.arrows[drag.i].bend = bendFrom(s.arrows[drag.i], p); break;
      case 'shadowA': s.shadow[0] = p; break;
      case 'shadowB': s.shadow[1] = p; break;
      case 'newzone': {
        const z = s.zones[drag.i], o = drag.origin;
        z.x = Math.min(o[0], p[0]); z.y = Math.min(o[1], p[1]);
        z.w = Math.max(6, Math.abs(p[0] - o[0])); z.h = Math.max(6, Math.abs(p[1] - o[1]));
        break;
      }
      case 'zoneSize': {
        const z = s.zones[drag.i];
        z.w = Math.max(6, p[0] - z.x); z.h = Math.max(6, p[1] - z.y);
        break;
      }
      case 'zoneMove': {
        const z = s.zones[drag.i];
        z.x += p[0] - drag.grab[0]; z.y += p[1] - drag.grab[1];
        drag.grab = p;
        break;
      }
      default: return;
    }
    draw();
  });

  const end = () => {
    if (!drag) return;
    /* חץ באורך אפס — כנראה לחיצה בטעות */
    const s = scenario();
    if ((drag.type === 'arrowB') && s.arrows[drag.i]) {
      const ar = s.arrows[drag.i];
      if (Math.hypot(ar.b[0] - ar.a[0], ar.b[1] - ar.a[1]) < 8) {
        s.arrows.splice(drag.i, 1);
        select(null);
      }
    }
    drag = null;
    commit();
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
}

function erase(hit) {
  if (!hit) return;
  const s = scenario();
  switch (hit.type) {
    case 'player': if (s.pos) delete s.pos[hit.num]; break;
    case 'opp': s.opp.splice(hit.i, 1); break;
    case 'ghost': s.ghosts.splice(hit.i, 1); break;
    case 'arrow': case 'arrowA': case 'arrowB': case 'arrowBend': s.arrows.splice(hit.i, 1); break;
    case 'zone': case 'zoneSize': s.zones.splice(hit.i, 1); break;
    case 'shadowA': case 'shadowB': delete s.shadow; break;
    default: return;
  }
  select(null);
  commit();
}

function commit() { draw(); touch(); }

/* ---------- פריט נבחר ---------- */

const KINDS = { run: 'ריצה', pass: 'מסירה', opt: 'אפשרות', press: 'תנועת יריב' };

function select(next) {
  sel = next;
  const box = $('sel');
  if (!sel) { box.hidden = true; draw(); return; }
  box.hidden = false;
  const s = scenario();
  const kinds = $('sel-kind');
  kinds.textContent = '';

  if (sel.type === 'arrow') {
    const ar = s.arrows[sel.i];
    $('sel-head').textContent = 'חץ נבחר';
    Object.entries(KINDS).forEach(([k, label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      if (ar.k === k) b.classList.add('primary');
      b.onclick = () => { ar.k = k; select(sel); commit(); };
      kinds.appendChild(b);
    });
    $('sel-label').value = ar.label || '';
    $('sel-label').oninput = e => {
      const v = e.target.value.trim();
      if (v) ar.label = v; else delete ar.label;
      commit();
    };
  } else if (sel.type === 'zone') {
    $('sel-head').textContent = 'אזור נבחר';
    $('sel-label').value = s.zones[sel.i].label || '';
    $('sel-label').oninput = e => { s.zones[sel.i].label = e.target.value; commit(); };
  }

  $('sel-del').onclick = () => erase(sel);
  draw();
}

/* ---------- כלים ---------- */

function setTool(t) {
  tool = t;
  [...$('tools').children].forEach(b => b.setAttribute('aria-pressed', b.dataset.tool === t));
  $('toolhint').textContent = HINTS[t] || '';
  if (t !== 'select') select(null);
  else if (pitch) draw();   /* הידיות תלויות בכלי, אז מציירים מחדש בכל החלפה */
}

function wireTools() {
  $('tools').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) setTool(b.dataset.tool);
  });
}

/* ---------- ניהול תרחישים ---------- */

function fillScenarioSelect() {
  const s = $('e-scenario');
  s.textContent = '';
  booklet.scenarios.forEach((sc, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = `${i + 1}. ${sc.title || '(ללא כותרת)'}`;
    s.appendChild(o);
  });
  s.value = idx;
}

function load(i) {
  idx = clamp(i, 0, booklet.scenarios.length - 1);
  $('e-scenario').value = idx;
  select(null);
  syncForm();
  draw();
}

function blank() {
  let n = booklet.scenarios.length + 1;
  const ids = new Set(booklet.scenarios.map(s => s.id));
  let id = 'scenario-' + n;
  while (ids.has(id)) id = 'scenario-' + (++n);
  return {
    id, phase: 'החזקה', chip: 'תרחיש חדש', title: 'תרחיש חדש', sub: '',
    pos: {}, ball: [200, 310], does: [''], mistake: '', cue: ''
  };
}

function wireScenarioBar() {
  $('e-scenario').onchange = e => load(+e.target.value);
  $('e-prev').onclick = () => load(idx - 1);
  $('e-next').onclick = () => load(idx + 1);
  $('e-add').onclick = () => {
    booklet.scenarios.splice(idx + 1, 0, blank());
    fillScenarioSelect(); load(idx + 1); touch();
  };
  $('e-dup').onclick = () => {
    const copy = JSON.parse(JSON.stringify(scenario()));
    copy.id = copy.id + '-2';
    copy.title += ' (עותק)';
    booklet.scenarios.splice(idx + 1, 0, copy);
    fillScenarioSelect(); load(idx + 1); touch();
  };
  $('e-del').onclick = () => {
    if (booklet.scenarios.length < 2) return toast('חייב להישאר תרחיש אחד');
    if (!confirm('למחוק את התרחיש?')) return;
    booklet.scenarios.splice(idx, 1);
    fillScenarioSelect(); load(Math.min(idx, booklet.scenarios.length - 1)); touch();
  };
  const move = d => {
    const j = idx + d;
    if (j < 0 || j >= booklet.scenarios.length) return;
    const [sc] = booklet.scenarios.splice(idx, 1);
    booklet.scenarios.splice(j, 0, sc);
    fillScenarioSelect(); load(j); touch();
  };
  $('e-moveup').onclick = () => move(-1);
  $('e-movedn').onclick = () => move(1);
}

/* ---------- טופס הטקסט ---------- */

const FIELDS = ['phase', 'chip', 'title', 'sub', 'mistake', 'cue', 'id'];

function syncForm() {
  const s = scenario();
  FIELDS.forEach(f => { $('f-' + f).value = s[f] || ''; });
  $('f-does').value = (s.does || []).join('\n');
}

function wireForm() {
  FIELDS.forEach(f => {
    $('f-' + f).addEventListener('input', e => {
      const s = scenario();
      const v = e.target.value;
      if (f === 'id') {
        const clean = v.trim().replace(/\s+/g, '-');
        const dup = booklet.scenarios.some((x, i) => i !== idx && x.id === clean);
        e.target.style.borderColor = (!clean || dup) ? '#E5326F' : '';
        if (!clean || dup) return;
        s.id = clean;
      } else {
        s[f] = v;
      }
      if (f === 'title') fillScenarioSelect();
      touch();
    });
  });
  $('f-does').addEventListener('input', e => {
    scenario().does = e.target.value.split('\n').map(x => x.trim()).filter(Boolean);
    touch();
  });
}

/* ---------- ייצוא ---------- */

const toJSON = obj => JSON.stringify(obj, null, 1) + '\n';

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('הועתק');
  } catch (e) {
    /* דפדפנים שחוסמים clipboard ללא הקשר מאובטח */
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast('הועתק');
  }
}

function encodeScenario(s) {
  const payload = { r: booklet.role, f: booklet.formation, t: booklet.title, s };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function wireExport() {
  $('x-booklet').onclick = () => {
    download(booklet.id + '.json', toJSON(booklet));
    toast('הורד. להעלות ל-content/ בריפו');
  };
  $('x-scenario').onclick = () => copy(toJSON(scenario()));
  $('x-link').onclick = () => {
    const base = location.href.replace(/editor\.html.*$/, 'index.html');
    copy(base + '#/x/' + encodeScenario(scenario()));
  };
}

/* ---------- ייבוא ---------- */

/** שולף ליטרל של מערך או אובייקט אחרי `const <name>=` בעזרת ספירת סוגריים */
function grabLiteral(src, name) {
  const at = src.indexOf('const ' + name + '=');
  if (at < 0) return null;
  const start = src.indexOf('=', at) + 1;
  let depth = 0, str = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (str) {
      if (c === '\\') { i++; continue; }
      if (c === str) str = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { str = c; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

function wireImport() {
  $('imp-go').onclick = () => {
    /* מסירים נקודה-פסיק מסיימת — נפוץ כשמדביקים קטע קוד ולא דף שלם */
    const src = $('imp-src').value.trim().replace(/;+$/, '').trim();
    $('imp-list').textContent = '';
    if (!src) return;
    let list;
    try {
      const literal = src.startsWith('[') ? src : grabLiteral(src, 'S');
      if (!literal) throw new Error('לא נמצא מערך S');
      /* הערכה של ליטרל מתוך דף שהמשתמש עצמו הכין */
      list = Function('"use strict";return (' + literal + ')')();
      if (!Array.isArray(list)) throw new Error('לא מערך');
    } catch (err) {
      $('imp-msg').textContent = 'לא הצלחתי לקרוא: ' + err.message;
      return;
    }
    $('imp-msg').textContent = `נמצאו ${list.length} תרחישים`;

    list.forEach((raw, i) => {
      const sc = normalize(raw, i);
      const row = document.createElement('div');
      row.className = 'imp-row';

      const th = document.createElement('div');
      th.className = 'thumb';
      try { th.appendChild(thumbnail(sc, formation, booklet.role)); } catch (e) { /* נתונים חלקיים */ }

      const t = document.createElement('div');
      t.className = 't';
      t.innerHTML = '';
      t.append(sc.title || '(ללא כותרת)');
      const small = document.createElement('small');
      small.textContent = sc.phase || '';
      t.appendChild(small);

      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'הוסף לחוברת';
      b.onclick = () => {
        while (booklet.scenarios.some(x => x.id === sc.id)) sc.id += '-2';
        booklet.scenarios.push(sc);
        fillScenarioSelect();
        load(booklet.scenarios.length - 1);
        touch();
        toast('נוסף בסוף החוברת');
      };

      row.append(th, t, b);
      $('imp-list').appendChild(row);
    });
  };
}

/* מזהה מופיע בכתובת, ולכן עדיף אותיות לטיניות. כותרת בעברית לא מייצרת
   מזהה קריא, אז נופלים למספר סידורי. */
const slug = (s, i) => {
  const ascii = (s || '').replace(/[^A-Za-z0-9 _-]/g, '').trim().replace(/\s+/g, '-').slice(0, 24);
  return ascii.replace(/^-+|-+$/g, '') || ('scenario-' + (i + 1));
};

function normalize(raw, i) {
  const s = {
    id: raw.id || slug(raw.chip || raw.title, i),
    phase: raw.phase || '', chip: raw.chip || raw.title || '', title: raw.title || '',
    sub: raw.sub || '', pos: raw.pos || {}, ball: raw.ball || [200, 310]
  };
  if (raw.zones && raw.zones.length) s.zones = raw.zones;
  if (raw.shadow) s.shadow = raw.shadow;
  if (raw.ghosts && raw.ghosts.length) s.ghosts = raw.ghosts;
  if (raw.arrows && raw.arrows.length) s.arrows = raw.arrows;
  if (raw.opp && raw.opp.length) s.opp = raw.opp;
  s.does = raw.does || [];
  s.mistake = raw.mistake || '';
  s.cue = raw.cue || '';
  return s;
}

/* ---------- הודעה קצרה ---------- */

let toastEl, toastTimer;
function toast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('on'), 1800);
}
