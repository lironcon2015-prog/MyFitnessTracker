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

/**
 * @param {SVGElement} svg  אלמנט ה-svg של המגרש
 * @param {{order:number[], base:Object}} formation  מיקומי ברירת מחדל לפי מספר חולצה
 * @param {number} role  מספר החולצה המודגש בוורוד — נקבע לפי החוברת, לא קשיח בקוד
 */
export function createPitch(svg, formation, role) {
  const q = id => svg.querySelector('#' + id);
  const gTeam = q('team'), gOpp = q('opp'), gArr = q('arrows'),
        gZone = q('zones'), gGhost = q('ghosts'), gBall = q('ball');

  const { order, base } = formation;
  const toks = {};
  gTeam.textContent = '';
  order.forEach(n => {
    const me = n === role;
    const g = el('g', { class: 'tok ' + (me ? 'eight' : 'mate'), transform: `translate(${base[n][0]},${base[n][1]})` });
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

  function render(s) {
    order.forEach(n => {
      const p = (s.pos && s.pos[n]) || base[n];
      toks[n].setAttribute('transform', `translate(${p[0]},${p[1]})`);
    });
    ballDot.setAttribute('cx', s.ball[0]);
    ballDot.setAttribute('cy', s.ball[1]);

    gZone.textContent = ''; gOpp.textContent = ''; gArr.textContent = ''; gGhost.textContent = '';

    (s.zones || []).forEach(z => {
      gZone.appendChild(el('rect', { x: z.x, y: z.y, width: z.w, height: z.h, rx: 6, class: 'zone fade' }));
      if (z.label) {
        const t = el('text', { x: z.x + z.w - 8, y: z.y + 16, class: 'zlabel fade', 'text-anchor': 'end' });
        t.textContent = z.label;
        gZone.appendChild(t);
      }
    });

    if (s.shadow) {
      const [p, r] = s.shadow;
      const dx = r[0] - p[0], dy = r[1] - p[1], l = Math.hypot(dx, dy) || 1;
      const ex = p[0] + dx / l * 140, ey = p[1] + dy / l * 140, nx = -dy / l * 34, ny = dx / l * 34;
      gZone.appendChild(el('path', { d: `M${p[0]} ${p[1]} L${ex + nx} ${ey + ny} L${ex - nx} ${ey - ny} Z`, class: 'shadow fade' }));
    }

    (s.ghosts || []).forEach(g => gGhost.appendChild(el('circle', { cx: g[0], cy: g[1], r: 13, class: 'ghost fade' })));

    (s.opp || []).forEach(o => {
      const g = el('g', { class: 'opp fade', transform: `translate(${o[0]},${o[1]})` });
      g.appendChild(el('circle', { r: 12, class: 'oppfill' }));
      g.appendChild(el('circle', { r: 12 }));
      gOpp.appendChild(g);
    });

    const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    (s.arrows || []).forEach((ar, k) => {
      const [a, b] = trim(ar.a, ar.b, ar.k === 'pass' ? 15 : 16, 17);
      const p = el('path', {
        d: arc(a, b, ar.bend || 0),
        class: 'arrow ' + (ARROW_CLASS[ar.k] || 'a-run'),
        'marker-end': `url(#${ARROW_MARKER[ar.k] || 'hp'})`
      });
      gArr.appendChild(p);
      if (!reduce) {
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
        const t = el('text', { x: (a[0] + b[0]) / 2 - 14, y: (a[1] + b[1]) / 2, class: 'alabel fade' });
        t.textContent = ar.label;
        gArr.appendChild(t);
      }
    });
  }

  return { render, tokens: toks, ball: ballDot, formation, role };
}
