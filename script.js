/** 
 * GYMPRO ELITE V11.3.0 
 * - FULL DATABASE RESTORED
 * - CALENDAR VIEW & DRAWER IMPLEMENTED
 * - STACK PRUNING FOR FREESTYLE FIX
 */

// --- GLOBAL STATE ---
let state = {
    week: 1, type: '', rm: 100, exIdx: 0, setIdx: 0, 
    log: [], currentEx: null, currentExName: '',
    historyStack: ['ui-week'],
    timerInterval: null, seconds: 0, startTime: null,
    isArmPhase: false, isFreestyle: false, isExtraPhase: false, isInterruption: false,
    currentMuscle: '',
    completedExInSession: [],
    workoutStartTime: null, workoutDurationMins: 0,
    lastLoggedSet: null,
    firstArmGroup: null, secondArmGroup: null,
    archiveView: 'list', calendarDate: new Date()
};

let audioContext, wakeLock = null, selectedArchiveIds = new Set();

// --- STORAGE ---
const StorageManager = {
    KEY_WEIGHTS: 'gympro_weights', KEY_RM: 'gympro_rm', KEY_ARCHIVE: 'gympro_archive',
    getData(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } },
    saveData(k, d) { localStorage.setItem(k, JSON.stringify(d)); },
    getLastWeight(ex) { return this.getData(this.KEY_WEIGHTS)[ex] || null; },
    saveWeight(ex, w) { let d = this.getData(this.KEY_WEIGHTS); d[ex] = w; this.saveData(this.KEY_WEIGHTS, d); },
    getLastRM(ex) { return this.getData(this.KEY_RM)[ex] || null; },
    saveRM(ex, r) { let d = this.getData(this.KEY_RM); d[ex] = r; this.saveData(this.KEY_RM, d); },
    saveToArchive(o) { let h = this.getArchive(); h.unshift(o); this.saveData(this.KEY_ARCHIVE, h); },
    getArchive() { try { return JSON.parse(localStorage.getItem(this.KEY_ARCHIVE)) || []; } catch { return []; } },
    deleteFromArchive(t) { let h = this.getArchive().filter(i => i.timestamp !== t); this.saveData(this.KEY_ARCHIVE, h); },
    getAllData() { return { weights: this.getData(this.KEY_WEIGHTS), rms: this.getData(this.KEY_RM), archive: this.getArchive() }; },
    restoreData(d) { if(d.weights) this.saveData(this.KEY_WEIGHTS, d.weights); if(d.rms) this.saveData(this.KEY_RM, d.rms); if(d.archive) this.saveData(this.KEY_ARCHIVE, d.archive); }
};

// --- DATABASE (100% RESTORED) ---
const unilateralExercises = ["Dumbbell Peck Fly", "Lateral Raises", "Single Leg Curl", "Dumbbell Bicep Curls", "Cable Fly", "Concentration Curls"];
const heavyCompounds = ["Overhead Press (Main)", "Bench Press (Main)", "Squat", "Deadlift"];

const exerciseDatabase = [
    { name: "Overhead Press (Main)", muscles: ["כתפיים"], isCalc: true, baseRM: 60, rmRange: [50, 100], manualRange: {base: 50, min: 40, max: 80, step: 2.5} },
    { name: "Lateral Raises", muscles: ["כתפיים"], sets: [{w: 12.5, r: 13}, {w: 12.5, r: 13}, {w: 12.5, r: 11}], step: 0.5 },
    { name: "Weighted Pull Ups", muscles: ["גב"], sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}], step: 5, minW: 0, maxW: 40, isBW: true },
    { name: "Face Pulls", muscles: ["כתפיים"], sets: [{w: 40, r: 13}, {w: 40, r: 13}, {w: 40, r: 15}], step: 2.5 },
    { name: "Barbell Shrugs", muscles: ["כתפיים"], sets: [{w: 140, r: 11}, {w: 140, r: 11}, {w: 140, r: 11}], step: 5 },
    { name: "Bench Press (Main)", muscles: ["חזה"], isCalc: true, baseRM: 100, rmRange: [80, 150], manualRange: {base: 85, min: 60, max: 140, step: 2.5} },
    { name: "Incline Bench Press", muscles: ["חזה"], sets: [{w: 65, r: 9}, {w: 65, r: 9}, {w: 65, r: 9}], step: 2.5 },
    { name: "Dumbbell Peck Fly", muscles: ["חזה"], sets: [{w: 14, r: 11}, {w: 14, r: 11}, {w: 14, r: 11}], step: 2 },
    { name: "Machine Peck Fly", muscles: ["חזה"], sets: [{w: 45, r: 11}, {w: 45, r: 11}, {w: 45, r: 11}], step: 1 },
    { name: "Cable Fly", muscles: ["חזה"], sets: [{w: 12.5, r: 11}, {w: 12.5, r: 11}, {w: 12.5, r: 11}], step: 2.5 },
    { name: "Leg Press", muscles: ["רגליים"], sets: [{w: 280, r: 8}, {w: 300, r: 8}, {w: 300, r: 7}], step: 5 },
    { name: "Squat", muscles: ["רגליים"], sets: [{w: 100, r: 8}, {w: 100, r: 8}, {w: 100, r: 8}], step: 2.5, minW: 60, maxW: 180 },
    { name: "Deadlift", muscles: ["רגליים"], sets: [{w: 100, r: 5}, {w: 100, r: 5}, {w: 100, r: 5}], step: 2.5, minW: 60, maxW: 180 },
    { name: "Romanian Deadlift", muscles: ["רגליים"], sets: [{w: 100, r: 8}, {w: 100, r: 8}, {w: 100, r: 8}], step: 2.5, minW: 60, maxW: 180 },
    { name: "Single Leg Curl", muscles: ["רגליים"], sets: [{w: 25, r: 8}, {w: 30, r: 6}, {w: 25, r: 8}], step: 2.5 },
    { name: "Lying Leg Curl (Double)", muscles: ["רגליים"], sets: [{w: 50, r: 8}, {w: 60, r: 6}, {w: 50, r: 8}], step: 5 },
    { name: "Seated Leg Curl", muscles: ["רגליים"], sets: [{w: 50, r: 10}, {w: 50, r: 10}, {w: 50, r: 10}], step: 5 }, 
    { name: "Seated Calf Raise", muscles: ["רגליים"], sets: [{w: 70, r: 10}, {w: 70, r: 10}, {w: 70, r: 12}], step: 5 },
    { name: "Standing Calf Raise", muscles: ["רגליים"], sets: [{w: 110, r: 10}, {w: 110, r: 10}, {w: 110, r: 12}], step: 10 },
    { name: "Lat Pulldown", muscles: ["גב"], sets: [{w: 75, r: 10}, {w: 75, r: 10}, {w: 75, r: 11}], step: 2.5 },
    { name: "Pull Ups", muscles: ["גב"], isBW: true, sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}] },
    { name: "Cable Row", muscles: ["גב"], sets: [{w: 65, r: 10}, {w: 65, r: 10}, {w: 65, r: 12}], step: 2.5 },
    { name: "Machine Row", muscles: ["גב"], sets: [{w: 50, r: 10}, {w: 50, r: 10}, {w: 50, r: 12}], step: 5 },
    { name: "Straight Arm Pulldown", muscles: ["גב"], sets: [{w: 30, r: 10}, {w: 30, r: 12}, {w: 30, r: 12}], step: 2.5 },
    { name: "Back Extension", muscles: ["גב"], sets: [{w: 0, r: 12}, {w: 0, r: 12}, {w: 0, r: 12}], step: 5, minW: 0, maxW: 50, isBW: true }
];

const armExercises = {
    biceps: [
        { name: "Dumbbell Bicep Curls", sets: [{w: 12, r: 8}], step: 0.5 },
        { name: "Barbell Bicep Curls", sets: [{w: 25, r: 8}], step: 1 },
        { name: "Concentration Curls", sets: [{w: 10, r: 10}], step: 0.5 }
    ],
    triceps: [
        { name: "Triceps Pushdown", sets: [{w: 35, r: 8}], step: 2.5 },
        { name: "Lying Triceps Extension", sets: [{w: 25, r: 8}], step: 2.5 }
    ]
};

const workouts = {
    'A': ["Overhead Press (Main)", "Barbell Shrugs", "Lateral Raises", "Weighted Pull Ups", "Face Pulls", "Incline Bench Press"],
    'B': ["Leg Press", "Single Leg Curl", "Lat Pulldown", "Cable Row", "Seated Calf Raise", "Straight Arm Pulldown"],
    'C': ["Bench Press (Main)", "Incline Bench Press", "Dumbbell Peck Fly", "Lateral Raises", "Face Pulls"]
};

const variationMap = {
    'B': { 1: ["Single Leg Curl", "Lying Leg Curl (Double)", "Seated Leg Curl"], 3: ["Cable Row", "Machine Row"], 4: ["Seated Calf Raise", "Standing Calf Raise"] },
    'C': { 2: ["Dumbbell Peck Fly", "Machine Peck Fly", "Cable Fly"] }
};

const workoutNames = { 'A': "אימון A", 'B': "אימון B", 'C': "אימון C", 'Freestyle': "Freestyle" };

// --- CORE SYSTEMS ---

function haptic(t='light') { if(navigator.vibrate) navigator.vibrate(t==='success'?[50,50,50]:(t==='medium'?40:20)); }
function playBeep(n=1) {
    if(!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    for(let i=0; i<n; i++) setTimeout(() => {
        let o=audioContext.createOscillator(), g=audioContext.createGain();
        o.type='sine'; o.frequency.setValueAtTime(880, audioContext.currentTime);
        g.gain.setValueAtTime(0.3, audioContext.currentTime); g.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime+0.4);
        o.connect(g); g.connect(audioContext.destination); o.start(); o.stop(audioContext.currentTime+0.4);
    }, i*500);
}

async function initAudio() { haptic('medium'); playBeep(1); document.getElementById('audio-init-btn').style.background="var(--success-gradient)"; try { if(navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch(e){} }

function navigate(id) {
    haptic('light'); document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active'); if(id!=='ui-main') stopRestTimer();
    if(state.historyStack[state.historyStack.length-1]!==id) state.historyStack.push(id);
    document.getElementById('global-back').style.visibility = (id==='ui-week')?'hidden':'visible';
}

function handleBackClick() {
    if(state.historyStack.length<=1) return; haptic('warning');
    let curr = state.historyStack.pop();
    if(curr==='ui-archive-detail') { navigate('ui-archive'); return; }
    if(curr==='ui-main' && state.setIdx > 0) { state.log.pop(); state.setIdx--; initPickers(); return; }
    let prev = state.historyStack[state.historyStack.length-1];
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(prev).classList.add('active');
    document.getElementById('global-back').style.visibility = (prev==='ui-week')?'hidden':'visible';
}

// --- WORKOUT ENGINE ---

function selectWeek(w) { state.week=w; navigate('ui-workout-type'); }
function selectWorkout(t) { state.type=t; state.exIdx=0; state.log=[]; state.completedExInSession=[]; state.workoutStartTime=Date.now(); showConfirmScreen(); }
function startFreestyle() { state.type='Freestyle'; state.log=[]; state.isFreestyle=true; state.workoutStartTime=Date.now(); navigate('ui-muscle-select'); }

function showExerciseList(m) {
    state.currentMuscle=m; let opts=document.getElementById('variation-options'); opts.innerHTML="";
    document.getElementById('variation-title').innerText=`תרגילי ${m}`;
    if(state.isFreestyle) {
        let b=document.createElement('button'); b.className="btn-text"; b.style.color="var(--accent)"; b.innerText="🡠 חזור לבחירת שריר";
        b.onclick=()=>navigate('ui-muscle-select'); opts.appendChild(b);
    }
    exerciseDatabase.filter(ex=>ex.muscles.includes(m) && !state.completedExInSession.includes(ex.name)).forEach(ex=>{
        let btn=document.createElement('button'); btn.className="menu-card"; btn.innerHTML=`<span>${ex.name}</span>➔`;
        btn.onclick=()=>{ state.currentEx=JSON.parse(JSON.stringify(ex)); state.currentExName=ex.name; if(ex.isCalc) state.currentEx.sets=Array(3).fill({w:ex.manualRange.base, r:8}); startRecording(); };
        opts.appendChild(btn);
    });
    navigate('ui-variation');
}

function showConfirmScreen(forceName=null) {
    if(forceName) {
        let d=exerciseDatabase.find(e=>e.name===forceName); state.currentEx=JSON.parse(JSON.stringify(d)); state.currentExName=d.name;
    } else if(variationMap[state.type]?.[state.exIdx]) { showVariationSelect(); return; }
    else {
        let n=workouts[state.type][state.exIdx], d=exerciseDatabase.find(e=>e.name===n);
        state.currentEx=JSON.parse(JSON.stringify(d)); state.currentExName=d.name;
    }
    document.getElementById('confirm-ex-name').innerText=state.currentExName;
    document.getElementById('btn-swap-confirm').style.display=(!state.isFreestyle && !state.isArmPhase)?'flex':'none';
    navigate('ui-confirm');
}

function showVariationSelect() {
    let opts=document.getElementById('variation-options'); opts.innerHTML="";
    variationMap[state.type][state.exIdx].filter(n=>!state.completedExInSession.includes(n)).forEach(n=>{
        let b=document.createElement('button'); b.className="menu-card"; b.innerHTML=`<span>${n}</span>➔`; b.onclick=()=>showConfirmScreen(n); opts.appendChild(b);
    });
    navigate('ui-variation');
}

function confirmExercise(doEx) { if(!doEx){ state.completedExInSession.push(state.currentExName); checkFlow(); return; } if(state.currentEx.isCalc) setupCalculatedEx(); else startRecording(); }

function setupCalculatedEx() {
    let last=StorageManager.getLastRM(state.currentExName) || state.currentEx.baseRM, p=document.getElementById('rm-picker'); p.innerHTML="";
    for(let i=state.currentEx.rmRange[0]; i<=state.currentEx.rmRange[1]; i+=2.5) { let o=new Option(i+" kg", i); if(i===last) o.selected=true; p.add(o); }
    navigate('ui-1rm');
}

function save1RM() {
    state.rm=parseFloat(document.getElementById('rm-picker').value); StorageManager.saveRM(state.currentExName, state.rm);
    let p=[0.65,0.75,0.85,0.75,0.65], r=[5,5,5,8,10];
    if(state.week===2){ p=[0.7,0.8,0.9,0.8,0.7,0.7]; r=[3,3,3,8,10,10]; } 
    else if(state.week===3){ p=[0.75,0.85,0.95,0.85,0.75,0.75]; r=[5,3,1,8,10,10]; }
    state.currentEx.sets = p.map((pct,i)=>({w:Math.round((state.rm*pct)/2.5)*2.5, r:r[i]})); startRecording();
}

function startRecording() { state.setIdx=0; state.lastLoggedSet=null; navigate('ui-main'); initPickers(); }

function initPickers() {
    let target=state.currentEx.sets[state.setIdx]; document.getElementById('ex-display-name').innerText=state.currentExName;
    document.getElementById('set-counter').innerText=`SET ${state.setIdx+1}/${state.currentEx.sets.length}`;
    let hist=document.getElementById('last-set-info'); if(state.lastLoggedSet){ hist.innerText=`סט אחרון: ${state.lastLoggedSet.w}kg x ${state.lastLoggedSet.r}`; hist.style.display='block'; } else hist.style.display='none';
    document.getElementById('btn-warmup').style.display=(state.setIdx===0 && heavyCompounds.includes(state.currentExName))?'block':'none';
    let ta=document.getElementById('timer-area'); if(state.setIdx>0){ ta.style.visibility='visible'; resetAndStartTimer(); } else { ta.style.visibility='hidden'; stopRestTimer(); }
    let wp=document.getElementById('weight-picker'); wp.innerHTML=""; let step=state.currentEx.step||2.5;
    let defW = state.currentEx.isCalc && target ? target.w : (state.lastLoggedSet?state.lastLoggedSet.w : (StorageManager.getLastWeight(state.currentExName)||0));
    for(let i=Math.max(0,defW-40); i<=defW+50; i=parseFloat((i+step).toFixed(2))){ let o=new Option(i+" kg",i); if(i===defW)o.selected=true; wp.add(o); }
    let rp=document.getElementById('reps-picker'); rp.innerHTML=""; let defR=target?target.r:8; for(let i=1;i<=30;i++){ let o=new Option(i,i); if(i===(state.lastLoggedSet?state.lastLoggedSet.r:defR))o.selected=true; rp.add(o); }
    let rirp=document.getElementById('rir-picker'); rirp.innerHTML=""; [0,0.5,1,1.5,2,2.5,3,4,5].forEach(v=>{ let o=new Option(v||"Fail",v); if(v===2)o.selected=true; rirp.add(o); });
}

function calcWarmup() {
    let tw=parseFloat(document.getElementById('weight-picker').value), l=document.getElementById('warmup-list'); l.innerHTML="";
    [0, 0.4, 0.6, 0.8].forEach((pct,i)=>{
        let w=i===0?20:Math.round((tw*pct)/2.5)*2.5, r=i===1?5:(i===2?3:2); if(i===0)r=10; if(w<tw){ let row=document.createElement('div'); row.innerText=`סט ${i+1}: ${w}kg x ${r}`; l.appendChild(row); }
    });
    document.getElementById('warmup-modal').style.display='flex';
}

function closeWarmup() { document.getElementById('warmup-modal').style.display='none'; }
function markWarmupDone() { state.log.push({exName:state.currentExName, isWarmup:true}); closeWarmup(); }

function nextStep() {
    haptic('light'); let w=parseFloat(document.getElementById('weight-picker').value), n=document.getElementById('set-notes').value.trim();
    let e={exName:state.currentExName, w, r:parseInt(document.getElementById('reps-picker').value), rir:document.getElementById('rir-picker').value, note:n};
    StorageManager.saveWeight(state.currentExName, w); state.log.push(e); state.lastLoggedSet=e;
    if(state.setIdx < state.currentEx.sets.length-1){ state.setIdx++; initPickers(); } else { haptic('medium'); navigate('ui-extra'); }
}

function handleExtra(isBonus) {
    if(isBonus){ state.setIdx++; state.currentEx.sets.push({...state.currentEx.sets[state.setIdx-1]}); initPickers(); navigate('ui-main'); }
    else {
        state.historyStack = state.historyStack.filter(s=>s!=='ui-main' && s!=='ui-extra');
        if(!state.completedExInSession.includes(state.currentExName)) state.completedExInSession.push(state.currentExName);
        if(state.isInterruption){ state.isInterruption=false; navigate('ui-confirm'); }
        else if(state.isFreestyle) showExerciseList(state.currentMuscle);
        else checkFlow();
    }
}

function checkFlow() {
    let list=workouts[state.type], idx=list.findIndex(ex=>!state.completedExInSession.includes(ex));
    if(idx!==-1){ state.exIdx=idx; showConfirmScreen(); } else finish();
}

function resetAndStartTimer() {
    stopRestTimer(); state.seconds=0; state.startTime=Date.now();
    let c=document.getElementById('timer-progress'), t=document.getElementById('rest-timer');
    state.timerInterval=setInterval(()=>{
        state.seconds=Math.floor((Date.now()-state.startTime)/1000);
        t.innerText=`${Math.floor(state.seconds/60).toString().padStart(2,'0')}:${(state.seconds%60).toString().padStart(2,'0')}`;
        c.style.strokeDashoffset=283-(Math.min(state.seconds/90,1)*283); if(state.seconds===90) playBeep(2);
    },100);
}
function stopRestTimer(){ if(state.timerInterval){ clearInterval(state.timerInterval); state.timerInterval=null; } }

function finish() {
    haptic('success'); state.workoutDurationMins=Math.floor((Date.now()-state.workoutStartTime)/60000); navigate('ui-summary');
    let date=new Date().toLocaleDateString('he-IL'), summary=`GYMPRO SUMMARY\n${workoutNames[state.type]||state.type} | ${date} | ${state.workoutDurationMins}m\n\n`;
    let grouped={}; state.log.forEach(e=>{ if(!grouped[e.exName])grouped[e.exName]={s:[], v:0, w:false}; if(e.isWarmup)grouped[e.exName].w=true; else if(!e.skip){ grouped[e.exName].s.push(`${e.w}kg x ${e.r} (RIR ${e.rir})`); grouped[e.exName].v+=(e.w*e.r); } });
    for(let ex in grouped){ summary+=`${ex} (Vol: ${grouped[ex].v}kg):\n${grouped[ex].w?'🔥 Warmup Done\n':''}${grouped[ex].s.join('\n')}\n\n`; }
    document.getElementById('summary-area').innerText=summary.trim();
    StorageManager.saveToArchive({timestamp:Date.now(), date, duration:state.workoutDurationMins, type:state.type, typeName:workoutNames[state.type]||state.type, summary:summary.trim()});
}

function copyResult() { let t=document.getElementById('summary-area').innerText; navigator.clipboard.writeText(t).then(()=>{ alert("הסיכום הועתק!"); location.reload(); }); }

// --- ARCHIVE & CALENDAR ---

function openArchive() { selectedArchiveIds.clear(); switchArchiveView(state.archiveView); navigate('ui-archive'); }

function switchArchiveView(v) {
    state.archiveView = v;
    document.getElementById('tab-list').classList.toggle('active', v==='list');
    document.getElementById('tab-calendar').classList.toggle('active', v==='calendar');
    document.getElementById('archive-list-container').style.display = v==='list'?'block':'none';
    document.getElementById('archive-calendar-container').style.display = v==='calendar'?'block':'none';
    if(v==='list') renderArchiveList(); else renderCalendar();
}

function renderArchiveList() {
    let l=document.getElementById('archive-list'); l.innerHTML="";
    StorageManager.getArchive().forEach(i=>{
        let c=document.createElement('div'); c.className="menu-card"; c.innerHTML=`<div class="archive-card-row"><input type="checkbox" class="archive-checkbox" data-id="${i.timestamp}"><div style="flex-grow:1"><h3>${i.date}</h3><p>${i.typeName || i.type}</p></div>➔</div>`;
        c.querySelector('.archive-checkbox').onclick=(e)=>{ e.stopPropagation(); if(e.target.checked) selectedArchiveIds.add(i.timestamp); else selectedArchiveIds.delete(i.timestamp); updateCopySelectedBtn(); };
        c.onclick=(e)=>{ if(e.target.type!=='checkbox') showArchiveDetail(i); }; l.appendChild(c);
    });
}

function renderCalendar() {
    let d = state.calendarDate;
    document.getElementById('cal-month-year').innerText = d.toLocaleString('he-IL', { month: 'long', year: 'numeric' });
    let grid = document.getElementById('calendar-grid'); grid.innerHTML = "";
    let first = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
    let daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    let archive = StorageManager.getArchive();
    for(let i=0; i<first; i++) grid.appendChild(Object.assign(document.createElement('div'), {className: 'calendar-day other-month'}));
    for(let day=1; day<=daysInMonth; day++) {
        let dateStr = new Date(d.getFullYear(), d.getMonth(), day).toLocaleDateString('he-IL');
        let workoutsOnDay = archive.filter(i => i.date === dateStr);
        let dayEl = document.createElement('div'); dayEl.className = 'calendar-day' + (workoutsOnDay.length ? ' has-workout' : '');
        if(dateStr === new Date().toLocaleDateString('he-IL')) dayEl.classList.add('today');
        dayEl.innerText = day;
        if(workoutsOnDay.length) {
            let markers = document.createElement('div'); markers.className = 'day-markers';
            workoutsOnDay.forEach(w => {
                let m = document.createElement('div'); m.className = `marker type-${(w.type || 'freestyle').toLowerCase()}`;
                markers.appendChild(m);
            });
            dayEl.appendChild(markers); dayEl.onclick = () => openDrawer(dateStr, workoutsOnDay);
        }
        grid.appendChild(dayEl);
    }
}

function changeMonth(n) { state.calendarDate.setMonth(state.calendarDate.getMonth() + n); renderCalendar(); }
function openDrawer(date, workouts) {
    document.getElementById('drawer-date').innerText = date;
    let list = document.getElementById('drawer-workouts'); list.innerHTML = "";
    workouts.forEach(w => {
        let b = document.createElement('button'); b.className = "menu-card";
        b.innerHTML = `<div><strong>${w.typeName || w.type}</strong><br><small>${w.duration} דק'</small></div>➔`;
        b.onclick = () => { closeDrawer(); showArchiveDetail(w); }; list.appendChild(b);
    });
    document.getElementById('calendar-drawer').classList.add('active');
}
function closeDrawer() { document.getElementById('calendar-drawer').classList.remove('active'); }
function updateCopySelectedBtn(){ let b=document.getElementById('btn-copy-selected'); b.disabled=selectedArchiveIds.size===0; b.style.opacity=b.disabled?0.5:1; }
function copyBulkLog(m) {
    let h=StorageManager.getArchive(), items=m==='all'?h:h.filter(i=>selectedArchiveIds.has(i.timestamp));
    if(!items.length) return; let txt=items.map(i=>i.summary).join('\n\n---\n\n');
    navigator.clipboard.writeText(txt).then(()=>alert("הועתק!"));
}

function showArchiveDetail(i) { document.getElementById('archive-detail-content').innerText=i.summary; document.getElementById('btn-archive-delete').onclick=()=>{ if(confirm("למחוק?")){ StorageManager.deleteFromArchive(i.timestamp); openArchive(); } }; navigate('ui-archive-detail'); }
function exportData() { let d=StorageManager.getAllData(), b=new Blob([JSON.stringify(d,null,2)],{type:"application/json"}), a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`gympro_backup.json`; a.click(); }
function triggerImport(){ document.getElementById('import-file').click(); }
function importData(i){ let r=new FileReader(); r.onload=(e)=>{ StorageManager.restoreData(JSON.parse(e.target.result)); location.reload(); }; r.readAsText(i.files[0]); }

// Placeholders for flow logic
function interruptWorkout() { state.isInterruption=true; navigate('ui-muscle-select'); }
function resumeWorkout() { state.isInterruption=false; navigate('ui-confirm'); }
function openSwapMenu() {
    let opts=document.getElementById('swap-options'); opts.innerHTML="";
    workouts[state.type].filter(n=>!state.completedExInSession.includes(n) && n!==state.currentExName).forEach(n=>{
        let b=document.createElement('button'); b.className="menu-card"; b.innerHTML=`<span>${n}</span>➔`;
        b.onclick=()=>{ state.exIdx=workouts[state.type].indexOf(n); showConfirmScreen(); }; opts.appendChild(b);
    });
    navigate('ui-swap-list');
}
