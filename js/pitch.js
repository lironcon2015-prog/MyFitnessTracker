/* ציור המגרש: שחקנים, כדור, חיצים, אזורים.
   מודול עצמאי — לא יודע דבר על ניווט, התקדמות או חוברות,
   כדי שגם מסך העריכה וגם תמונות מוקטנות יוכלו להשתמש בו. */

const NS = 'http://www.w3.org/2000/svg';

export const el = (n, a = {}) => {
  const e = document.createElementNS(NS, n);
  for (const k in a) e.setAttribute(k, a[k]);
  return e;
};

/* קיצור החץ בקצוות כדי שלא ייגע בעיגול השחקן */
export function trim(a, b, t1, t2) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  return [[a[0] + dx / l * t1, a[1] + dy / l * t1], [b[0] - dx / l * t2, b[1] - dy / l * t2]];
}

/* קשת בין שתי נקודות. bend הוא סקלר יחיד: חיובי לצד אחד, שלילי לשני */
export function arc(a, b, bend) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  return `M${a[0]} ${a[1]} Q${mx - dy / l * bend} ${my + dx / l * bend} ${b[0]} ${b[1]}`;
}

const ARROW_CLASS = { pass: 'a-pass', opt: 'a-opt', press: 'a-press', run: 'a-run' };
const ARROW_MARKER = { pass: 'hb', press: 'hg', run: 'hp', opt: 'hp' };
const HEAD_FILL = { hp: '#E5326F', hb: '#1F4FA8', hg: '#6E7A6B' };

let uidSeq = 0;

/** בונה את שלד המגרש: קווים, ראשי חיצים וקבוצות ריקות.
    כל מגרש מקבל מזהה משלו כדי ששני מגרשים באותו דף לא יתנגשו. */
export function buildPitch() {
  const uid = 'p' + (++uidSeq);
  const svg = el('svg', {
    class: 'pitch', viewBox: '0 0 400 620',
    role: 'img', 'aria-label': 'דיאגרמת מגרש תשיעיות'
  });
  svg.dataset.uid = uid;

  const defs = el('defs');
  for (const [name, fill] of Object.entries(HEAD_FILL)) {
    const m = el('marker', {
      id: `${name}-${uid}`, viewBox: '0 0 10 10', refX: 8, refY: 5,
      markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse'
    });
    m.appendChild(el('path', { d: 'M0 0 L10 5 L0 10 z', fill }));
    defs.appendChild(m);
  }
  svg.appendChild(defs);

  svg.appendChild(el('rect', { x: 20, y: 20, width: 360, height: 580, fill: '#D6DAC6' }));
  svg.appendChild(el('g', { class: 'g-zones' }));

  const lines = el('g', { class: 'pl' });
  const dot = (cx, cy) => el('circle', { cx, cy, r: 2.4, fill: '#17211F', stroke: 'none', opacity: '.4' });
  lines.appendChild(el('rect', { x: 20, y: 20, width: 360, height: 580 }));
  lines.appendChild(el('line', { x1: 20, y1: 310, x2: 380, y2: 310 }));
  lines.appendChild(el('circle', { cx: 200, cy: 310, r: 52 }));
  lines.appendChild(dot(200, 310));
  lines.appendChild(el('rect', { x: 96, y: 509, width: 208, height: 91 }));
  lines.appendChild(el('rect', { x: 150, y: 562, width: 100, height: 38 }));
  lines.appendChild(dot(200, 525));
  lines.appendChild(el('rect', { x: 96, y: 20, width: 208, height: 91 }));
  lines.appendChild(el('rect', { x: 150, y: 20, width: 100, height: 38 }));
  lines.appendChild(dot(200, 95));
  lines.appendChild(el('rect', { x: 170, y: 596, width: 60, height: 8 }));
  lines.appendChild(el('rect', { x: 170, y: 16, width: 60, height: 8 }));
  svg.appendChild(lines);

  ['g-ghosts', 'g-arrows', 'g-opp', 'g-team', 'g-ball'].forEach(c => svg.appendChild(el('g', { class: c })));
  return svg;
}

/**
 * @param {SVGElement} svg  מגרש שנבנה ב-buildPitch
 * @param {{order:number[], base:Object}} formation  מיקומי ברירת מחדל לפי מספר חולצה
 * @param {number} role  מספר החולצה המודגש בוורוד — נקבע לפי החוברת, לא קשיח בקוד
 */
export function createPitch(svg, formation, role) {
  const uid = svg.dataset.uid;
  const q = c => svg.querySelector('.' + c);
  const gTeam = q('g-team'), gOpp = q('g-opp'), gArr = q('g-arrows'),
        gZone = q('g-zones'), gGhost = q('g-ghosts'), gBall = q('g-ball');

  const { order, base } = formation;
  const toks = {};
  gTeam.textContent = '';
  order.forEach(n => {
    const me = n === role;
    const g = el('g', { class: 'tok ' + (me ? 'eight' : 'mate'), transform: `translate(${base[n][0]},${base[n][1]})` });
    g.dataset.num = n;   /* לתפיסה בגרירה בעורך */
    g.appendChild(el('circle', { r: me ? 14.5 : 12.5 }));
    const t = el('text');
    t.textContent = n;
    g.appendChild(t);
    gTeam.appendChild(g);
    toks[n] = g;
  });

  gBall.textContent = '';
  const ballDot = el('circle', { r: 4.6, class: 'ball' });
  gBall.appendChild(ballDot);

  function render(s, opts = {}) {
    /* decorate=false רק לתמונות מוקטנות: בלי מחלקות אנימציה כלל.
       בתנועה מופחתת המחלקות כן נוספות ו-CSS מנטרל אותן — כך שהפלט
       זהה בדיוק לגרסה שקדמה לפירוק, כולל החלקת הקצוות. */
    const decorate = opts.animate !== false;
    const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    const fade = decorate ? ' fade' : '';

    order.forEach(n => {
      const p = (s.pos && s.pos[n]) || base[n];
      toks[n].setAttribute('transform', `translate(${p[0]},${p[1]})`);
    });
    ballDot.setAttribute('cx', s.ball[0]);
    ballDot.setAttribute('cy', s.ball[1]);

    gZone.textContent = ''; gOpp.textContent = ''; gArr.textContent = ''; gGhost.textContent = '';

    (s.zones || []).forEach((z, i) => {
      const r = el('rect', { x: z.x, y: z.y, width: z.w, height: z.h, rx: 6, class: 'zone' + fade });
      r.dataset.zone = i;
      gZone.appendChild(r);
      if (z.label) {
        const t = el('text', { x: z.x + z.w - 8, y: z.y + 16, class: 'zlabel' + fade, 'text-anchor': 'end' });
        t.textContent = z.label;
        gZone.appendChild(t);
      }
    });

    if (s.shadow) {
      const [p, r] = s.shadow;
      const dx = r[0] - p[0], dy = r[1] - p[1], l = Math.hypot(dx, dy) || 1;
      const ex = p[0] + dx / l * 140, ey = p[1] + dy / l * 140, nx = -dy / l * 34, ny = dx / l * 34;
      gZone.appendChild(el('path', { d: `M${p[0]} ${p[1]} L${ex + nx} ${ey + ny} L${ex - nx} ${ey - ny} Z`, class: 'shadow' + fade }));
    }

    (s.ghosts || []).forEach((g, i) => {
      const c = el('circle', { cx: g[0], cy: g[1], r: 13, class: 'ghost' + fade });
      c.dataset.ghost = i;
      gGhost.appendChild(c);
    });

    (s.opp || []).forEach((o, i) => {
      const g = el('g', { class: 'opp' + fade, transform: `translate(${o[0]},${o[1]})` });
      g.dataset.opp = i;
      g.appendChild(el('circle', { r: 12, class: 'oppfill' }));
      g.appendChild(el('circle', { r: 12 }));
      gOpp.appendChild(g);
    });

    (s.arrows || []).forEach((ar, k) => {
      const [a, b] = trim(ar.a, ar.b, ar.k === 'pass' ? 15 : 16, 17);
      const marker = ARROW_MARKER[ar.k] || 'hp';
      const p = el('path', {
        d: arc(a, b, ar.bend || 0),
        class: 'arrow ' + (ARROW_CLASS[ar.k] || 'a-run'),
        'marker-end': `url(#${marker}-${uid})`
      });
      p.dataset.arrow = k;
      gArr.appendChild(p);
      if (decorate && !reduce) {
        if (ar.k === 'run') {
          p.style.setProperty('--len', p.getTotalLength());
          p.classList.add('draw');
          p.style.animationDelay = (0.18 + k * 0.1) + 's';
        } else {
          p.classList.add('draw');
          p.style.animationDelay = (0.28 + k * 0.12) + 's';
        }
      }
      if (ar.label) {
        const t = el('text', { x: (a[0] + b[0]) / 2 - 14, y: (a[1] + b[1]) / 2, class: 'alabel' + fade });
        t.textContent = ar.label;
        gArr.appendChild(t);
      }
    });
  }

  return { render, tokens: toks, ball: ballDot, formation, role };
}

/** מגרש קטן וסטטי לכרטיס בספרייה */
export function thumbnail(scenario, formation, role) {
  const svg = buildPitch();
  svg.classList.add('mini');
  svg.setAttribute('aria-hidden', 'true');
  svg.removeAttribute('role');
  svg.removeAttribute('aria-label');
  createPitch(svg, formation, role).render(scenario, { animate: false });
  return svg;
}
