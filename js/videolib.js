/* מסך ספריית הסרטונים: הוספת קישור, כותרות, וסרטון-סרטון.

   הפעולה שצריכה להיות הכי קלה היא ההוספה — רואים סרטון באינסטגרם, מעתיקים
   את הקישור, ורוצים שהוא ייכנס בשתי נגיעות. לכן טופס ההוספה נפתח למעלה,
   הכתובת נדבקת מהלוח בכפתור אחד, והכותרת אינה חובה. */

import {
  listCategories, addCategory, renameCategory, removeCategory, countByCategory,
  listVideos, addVideo, updateVideo, removeVideo, categoryName,
  detectPlatform, platformName, embedUrl, embedBlocked, isPortrait, playable,
  thumbUrl, normalizeUrl, videoCount
} from './videos.js';
import { needsResolve, resolveUrl } from './resolve.js';

const $ = id => document.getElementById(id);

/* הקטגוריה שמסוננת כרגע: null הכול · '' בלי כותרת · מזהה קטגוריה */
let filter = null;
let editing = null;      // מזהה הסרטון שנמצא בעריכה
let managing = false;    // האם פאנל ניהול הכותרות פתוח

/** תאריך קצר — "היום", "אתמול", ואחר כך תאריך */
function whenText(ms) {
  const day = 24 * 60 * 60 * 1000;
  const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
  const diff = midnight.getTime() - new Date(ms).setHours(0, 0, 0, 0);
  if (diff <= 0) return 'היום';
  if (diff <= day) return 'אתמול';
  return new Date(ms).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
}

/* --- טופס ההוספה --- */

function fillCategorySelect(select, selected) {
  select.textContent = '';
  const none = document.createElement('option');
  none.value = '';
  none.textContent = 'בלי כותרת';
  select.appendChild(none);
  listCategories().forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.name;
    if (c.id === selected) o.selected = true;
    select.appendChild(o);
  });
  const neu = document.createElement('option');
  neu.value = '__new';
  neu.textContent = '＋ כותרת חדשה…';
  /* גם "חדשה" נשמרת בבנייה מחדש — אחרת סינון תוך כדי הקלדת שם חדש היה
     מאפס את הבחירה ומשאיר שדה שם פתוח בלי כלום מאחוריו */
  if (selected === '__new') neu.selected = true;
  select.appendChild(neu);
}

function setError(msg) {
  const box = $('v-error');
  box.textContent = msg || '';
  box.hidden = !msg;
}

function resetForm() {
  $('v-url').value = '';
  $('v-title').value = '';
  $('v-note').value = '';
  $('v-newcat').value = '';
  $('v-newcat').hidden = true;
  setError('');
  $('v-form').dataset.editing = '';
  editing = null;
  $('v-save').textContent = 'הוסף לספרייה';
  $('v-cancel').hidden = true;
  $('v-formtitle').textContent = 'הוסף סרטון';
}

/** פותח את הטופס עם ערכים — מקישור ששותף, או לעריכת סרטון קיים */
function openForm(values, video) {
  const form = $('v-form');
  form.open = true;
  if (video) {
    editing = video.id;
    form.dataset.editing = video.id;
    $('v-url').value = video.url;
    $('v-title').value = video.title;
    $('v-note').value = video.note;
    fillCategorySelect($('v-cat'), video.category || '');
    $('v-save').textContent = 'שמור שינויים';
    $('v-cancel').hidden = false;
    $('v-formtitle').textContent = 'עריכת סרטון';
  } else if (values) {
    if (values.url) $('v-url').value = values.url;
    if (values.title) $('v-title').value = values.title;
  }
  setError('');
}

/* --- שורת הסינון --- */

function renderFilters(repaint) {
  const rail = $('v-chips');
  rail.textContent = '';
  const counts = countByCategory();
  const total = videoCount();

  const chip = (label, value, n) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(filter === value));
    b.textContent = label;
    if (n !== null) {
      const c = document.createElement('span');
      c.className = 'chipn';
      c.textContent = n;
      b.appendChild(c);
    }
    b.onclick = () => { filter = value; repaint(); };
    rail.appendChild(b);
  };

  chip('הכול', null, total);
  listCategories().forEach(c => chip(c.name, c.id, counts[c.id] || 0));
  /* "בלי כותרת" מוצג רק כשיש שם משהו — אחרת זו רק עוד כפתור ריק */
  if (counts['']) chip('בלי כותרת', '', counts['']);
}

/* --- ניהול הכותרות --- */

function renderManage(repaint) {
  const box = $('v-manage');
  box.hidden = !managing;
  box.textContent = '';
  if (!managing) return;

  const counts = countByCategory();
  listCategories().forEach(c => {
    const row = document.createElement('div');
    row.className = 'catrow';

    const name = document.createElement('span');
    name.className = 'catname';
    name.textContent = c.name;

    const n = document.createElement('span');
    n.className = 'catn';
    n.textContent = (counts[c.id] || 0) + ' סרטונים';

    const rename = document.createElement('button');
    rename.type = 'button';
    rename.textContent = 'שנה שם';
    rename.onclick = () => {
      const next = prompt('שם חדש לכותרת', c.name);
      if (next && next.trim()) { renameCategory(c.id, next); repaint(); }
    };

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'danger';
    del.textContent = 'מחק';
    del.onclick = () => {
      const has = counts[c.id] || 0;
      const ask = has
        ? `למחוק את "${c.name}"? ${has} סרטונים יעברו ל"בלי כותרת" ולא יימחקו.`
        : `למחוק את "${c.name}"?`;
      if (!confirm(ask)) return;
      removeCategory(c.id);
      if (filter === c.id) filter = null;
      repaint();
    };

    row.append(name, n, rename, del);
    box.appendChild(row);
  });

  const add = document.createElement('div');
  add.className = 'catadd';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'כותרת חדשה — למשל בעיטות חופשיות';
  const go = document.createElement('button');
  go.type = 'button';
  go.textContent = 'הוסף כותרת';
  const submit = () => {
    if (!input.value.trim()) return;
    addCategory(input.value);
    repaint();
  };
  go.onclick = submit;
  input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } };
  add.append(input, go);
  box.appendChild(add);
}

/* --- רשימת הסרטונים --- */

function renderList(repaint) {
  const list = $('v-list');
  list.textContent = '';
  const videos = listVideos(filter);

  if (!videos.length) {
    const empty = document.createElement('p');
    empty.className = 'vempty';
    empty.textContent = videoCount()
      ? 'אין כאן סרטונים בכותרת הזאת עדיין.'
      : 'עוד אין סרטונים. העתק קישור מיוטיוב, אינסטגרם או פייסבוק והדבק אותו למעלה.';
    list.appendChild(empty);
    return;
  }

  videos.forEach(v => list.appendChild(videoCard(v, repaint)));
}

function videoCard(v, repaint) {
  const card = document.createElement('div');
  card.className = 'vcard';

  /* תמונה מוקטנת קיימת ליוטיוב בלבד; בשאר מוצג שם הפלטפורמה כאריח.
     כשאין רשת גם התמונה נופלת, ולכן onerror מחליף אותה באריח. */
  const thumb = document.createElement('div');
  thumb.className = 'vthumb p-' + v.platform;
  const tile = () => {
    thumb.textContent = platformName(v.platform);
  };
  const src = thumbUrl(v.url);
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    img.onerror = tile;
    thumb.appendChild(img);
  } else {
    tile();
  }

  const body = document.createElement('div');
  body.className = 'vbody';

  const meta = document.createElement('div');
  meta.className = 'vmeta';
  meta.textContent = platformName(v.platform);
  const cat = v.category ? categoryName(v.category) : '';
  if (cat) {
    const tag = document.createElement('span');
    tag.className = 'vtag';
    tag.textContent = cat;
    meta.appendChild(tag);
  }
  const when = document.createElement('span');
  when.className = 'vwhen';
  when.textContent = whenText(v.at);
  meta.appendChild(when);

  const h3 = document.createElement('h3');
  h3.textContent = v.title;

  body.append(meta, h3);

  if (v.note) {
    const note = document.createElement('p');
    note.className = 'vnote';
    note.textContent = v.note;
    body.appendChild(note);
  }

  const acts = document.createElement('div');
  acts.className = 'vacts';

  /* "פתח" הוא הפעולה הראשית: בטלפון הצפייה באפליקציה המקורית נוחה
     מכל נגן משובץ, וחלק מהפלטפורמות ממילא חוסמות שיבוץ. */
  const open = document.createElement('a');
  open.className = 'vopen';
  open.href = v.url;
  open.target = '_blank';
  open.rel = 'noopener noreferrer';
  open.textContent = 'פתח';
  acts.appendChild(open);

  /* השיבוץ נטען רק בלחיצה — אחרת כל גלילה בספרייה הייתה מושכת נגנים */
  const embed = embedUrl(playable(v));
  if (embed) {
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'vplay';
    play.textContent = 'נגן כאן';
    play.onclick = () => {
      if (card.querySelector('.vframe')) {
        card.querySelector('.vframe').remove();
        play.textContent = 'נגן כאן';
        return;
      }
      const frame = document.createElement('div');
      frame.className = 'vframe' + (isPortrait(playable(v)) ? ' tall' : '');
      const f = document.createElement('iframe');
      f.src = embed;
      f.title = v.title;
      f.loading = 'lazy';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.appendChild(f);

      /* מה שקורה בתוך המסגרת שייך לפייסבוק או לאינסטגרם, והדף לא יכול
         לקרוא אותו — גם לא כדי לדעת שהוצג "Video unavailable". לכן דרך
         היציאה כתובה מראש מתחת לנגן, ולא מחכה לזיהוי שאי אפשר לעשות. */
      const out = document.createElement('p');
      out.className = 'vout';
      out.append('לא נטען? יש סרטונים שהפלטפורמה לא מרשה לנגן מחוץ לאפליקציה שלה. ');
      const link = document.createElement('a');
      link.href = v.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'פתח אותו שם';
      out.appendChild(link);
      out.append('.');
      frame.appendChild(out);

      card.appendChild(frame);
      play.textContent = 'סגור';
    };
    acts.appendChild(play);
  }

  const why = embed ? null : embedBlocked(playable(v));

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'vedit';
  edit.textContent = 'ערוך';
  edit.onclick = () => {
    openForm(null, v);
    $('v-form').scrollIntoView({ block: 'start' });
  };
  acts.appendChild(edit);

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'vdel';
  del.textContent = 'מחק';
  del.onclick = () => {
    if (!confirm('למחוק את "' + v.title + '" מהספרייה?')) return;
    removeVideo(v.id);
    if (editing === v.id) resetForm();
    repaint();
  };
  acts.appendChild(del);

  body.appendChild(acts);
  if (why) {
    const note = document.createElement('p');
    note.className = 'vwhy';
    note.textContent = why;
    /* קישור שנשמר לפני שהפותח היה קיים, או שהפתיחה נכשלה אז — כאן אפשר
       לנסות שוב בלי למחוק ולהוסיף מחדש */
    if (needsResolve(v.url)) {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'vretry';
      retry.textContent = 'נסה לפתוח את הקישור';
      retry.onclick = async () => {
        retry.disabled = true;
        retry.textContent = 'פותח…';
        const full = await resolveUrl(v.url);
        if (full) { updateVideo(v.id, { full }); repaint(); return; }
        retry.disabled = false;
        retry.textContent = 'לא הצלחנו — נסה שוב';
      };
      note.append(' ');
      note.appendChild(retry);
    }
    body.appendChild(note);
  }
  card.append(thumb, body);
  return card;
}

/* --- הרכבת המסך --- */

/** prefill: {url,title} מקישור ששותף לאפליקציה, או null */
export function mountVideos(prefill) {
  const repaint = () => {
    renderFilters(repaint);
    renderManage(repaint);
    renderList(repaint);
    /* בחירת הקטגוריה בטופס נבנית מחדש כי ייתכן שנוספה או נמחקה כותרת */
    const keep = editing ? ($('v-cat').value) : ($('v-cat').value || defaultCat());
    fillCategorySelect($('v-cat'), keep);
  };

  /* כשמסננים לפי כותרת, סרטון חדש שייך כנראה לאותה כותרת */
  const defaultCat = () => (filter && filter !== '' ? filter : '');

  document.title = 'ספריית הסרטונים — תשיעיות';
  resetForm();
  fillCategorySelect($('v-cat'), defaultCat());

  /* "כותרת חדשה…" בבחירה פותח שדה טקסט במקום לקפוץ לפאנל הניהול */
  const onCatChange = () => {
    const neu = $('v-cat').value === '__new';
    $('v-newcat').hidden = !neu;
    if (neu) $('v-newcat').focus();
  };
  $('v-cat').addEventListener('change', onCatChange);

  const onPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { $('v-url').value = text.trim(); setError(''); }
    } catch (e) {
      setError('הדפדפן לא נתן גישה ללוח. אפשר להדביק ידנית בשדה.');
    }
  };
  $('v-paste').addEventListener('click', onPaste);

  const onSubmit = async e => {
    e.preventDefault();
    const url = $('v-url').value;
    if (!normalizeUrl(url)) {
      setError('הקישור לא נראה תקין. הדבק כתובת מלאה, למשל https://www.youtube.com/watch?v=…');
      return;
    }
    let category = $('v-cat').value;
    if (category === '__new') {
      const made = addCategory($('v-newcat').value);
      if (!made) { setError('תן שם לכותרת החדשה, או בחר כותרת קיימת.'); return; }
      category = made.id;
    }
    const fields = {
      url,
      title: $('v-title').value,
      note: $('v-note').value,
      category: category || null
    };

    /* קישור מקוצר נפתח לפני השמירה, כדי שהפנייה החוצה תקרה פעם אחת.
       הכפתור מדווח, כי זו השהיה של שנייה-שתיים שהמשתמש רואה. */
    if (needsResolve(normalizeUrl(url))) {
      const label = $('v-save').textContent;
      $('v-save').disabled = true;
      $('v-save').textContent = 'פותח את הקישור…';
      fields.full = await resolveUrl(normalizeUrl(url));
      $('v-save').disabled = false;
      $('v-save').textContent = label;
    }

    const saved = editing ? updateVideo(editing, fields) : addVideo(fields);
    if (!saved) { setError('לא הצלחנו לשמור את הקישור.'); return; }
    const wasEditing = !!editing;
    resetForm();
    fillCategorySelect($('v-cat'), saved.category || '');
    repaint();
    if (!wasEditing) $('v-form').open = true;
  };
  $('v-formel').addEventListener('submit', onSubmit);

  const onCancel = () => { resetForm(); fillCategorySelect($('v-cat'), defaultCat()); };
  $('v-cancel').addEventListener('click', onCancel);

  const onManage = () => {
    managing = !managing;
    $('v-managego').setAttribute('aria-expanded', String(managing));
    repaint();
  };
  $('v-managego').addEventListener('click', onManage);

  repaint();
  /* בספרייה מלאה הרשימה היא מה שרוצים לראות, ולכן הטופס מקופל. בספרייה
     ריקה, ובקישור שהגיע משיתוף, ההוספה היא כל הסיבה שנכנסת לכאן. */
  $('v-form').open = videoCount() === 0;
  if (prefill && (prefill.url || prefill.title)) openForm(prefill, null);

  return {
    /* מקשי חצים מדלגים בין תרחישים במסכים האחרים; כאן אין מה לדלף */
    go() {},
    destroy() {
      $('v-cat').removeEventListener('change', onCatChange);
      $('v-paste').removeEventListener('click', onPaste);
      $('v-formel').removeEventListener('submit', onSubmit);
      $('v-cancel').removeEventListener('click', onCancel);
      $('v-managego').removeEventListener('click', onManage);
      managing = false;
      resetForm();
    }
  };
}
