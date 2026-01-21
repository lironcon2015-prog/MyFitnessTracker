/**
 * GYMPRO ELITE V 10.9.2.1 - FIXED CALCULATED RANGES & NOTES
 */

let state = {
    week: 1, type: '', rm: 100, exIdx: 0, setIdx: 0, 
    log: [], currentEx: null, currentExName: '',
    historyStack: ['ui-week'],
    timerInterval: null, seconds: 0, startTime: null,
    isArmPhase: false, isFreestyle: false, isExtraPhase: false, isInterruption: false,
    currentMuscle: '', completedExInSession: [],
    workoutStartTime: null, workoutDurationMins: 0,
    lastLoggedSet: null, currentArchiveView: null
};

let audioContext;
let wakeLock = null;

const StorageManager = {
    KEY_WEIGHTS: 'gympro_weights', KEY_RM: 'gympro_rm', KEY_ARCHIVE: 'gympro_archive',
    getData(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } },
    saveData(key, data) { localStorage.setItem(key, JSON.stringify(data)); },
    getLastWeight(exName) { return this.getData(this.KEY_WEIGHTS)[exName] || null; },
    saveWeight(exName, weight) { const d = this.getData(this.KEY_WEIGHTS); d[exName] = weight; this.saveData(this.KEY_WEIGHTS, d); },
    getLastRM(exName) { return this.getData(this.KEY_RM)[exName] || null; },
    saveRM(exName, rmVal) { const d = this.getData(this.KEY_RM); d[exName] = rmVal; this.saveData(this.KEY_RM, d); },
    saveToArchive(obj) { let h = this.getArchive(); h.unshift(obj); localStorage.setItem(this.KEY_ARCHIVE, JSON.stringify(h)); },
    getArchive() { return JSON.parse(localStorage.getItem(this.KEY_ARCHIVE)) || []; },
    deleteFromArchive(ts) { let h = this.getArchive().filter(x => x.timestamp !== ts); localStorage.setItem(this.KEY_ARCHIVE, JSON.stringify(h)); }
};

const unilateralExercises = ["Dumbbell Peck Fly", "Lateral Raises", "Single Leg Curl", "Dumbbell Bicep Curls", "Cable Fly", "Concentration Curls"];

const exerciseDatabase = [
    { name: "Overhead Press (Main)", muscles: ["כתפיים"], isCalc: true, baseRM: 60, rmRange: [50, 100], manualRange: {min: 40, max: 100} },
    { name: "Lateral Raises", muscles: ["כתפיים"], sets: [{w: 12.5, r: 13}, {w: 12.5, r: 13}, {w: 12.5, r: 11}], step: 0.5 },
    { name: "Weighted Pull Ups", muscles: ["גב"], sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}], step: 5, isBW: true },
    { name: "Face Pulls", muscles: ["כתפיים"], sets: [{w: 40, r: 13}, {w: 40, r: 13}, {w: 40, r: 15}], step: 2.5 },
    { name: "Barbell Shrugs", muscles: ["כתפיים"], sets: [{w: 140, r: 11}, {w: 140, r: 11}, {w: 140, r: 11}], step: 5 },
    { name: "Bench Press (Main)", muscles: ["חזה"], isCalc: true, baseRM: 100, rmRange: [80, 150], manualRange: {min: 60, max: 150} },
    { name: "Incline Bench Press", muscles: ["חזה"], sets: [{w: 65, r: 9}, {w: 65, r: 9}, {w: 65, r: 9}], step: 2.5 },
    { name: "Dumbbell Peck Fly", muscles: ["חזה"], sets: [{w: 14, r: 11}, {w: 14, r: 11}, {w: 14, r: 11}], step: 2 },
    { name: "Cable Fly", muscles: ["חזה"], sets: [{w: 12.5, r: 11}, {w: 12.5, r: 11}, {w: 12.5, r: 11}], step: 2.5 },
    { name: "Leg Press", muscles: ["רגליים"], sets: [{w: 280, r: 8}, {w: 300, r: 8}, {w: 300, r: 7}], step: 5 },
    { name: "Lat Pulldown", muscles: ["גב"], sets: [{w: 75, r: 10}, {w: 75, r: 10}, {w: 75, r: 11}], step: 2.5 },
    { name: "Cable Row", muscles: ["גב"], sets: [{w: 65, r: 10}, {w: 65, r: 10}, {w: 65, r: 12}], step: 2.5 }
];

const armExercises = {
    biceps: [{ name: "Dumbbell Bicep Curls", sets: [{w: 12, r: 8}], step: 0.5 }, { name: "Barbell Bicep Curls", sets: [{w: 25, r: 8}], step: 1 }],
    triceps: [{ name: "Triceps Pushdown", sets: [{w: 35, r: 8}], step: 2.5 }]
};

const workouts = { 'A': ["Overhead Press (Main)", "Barbell Shrugs", "Lateral Raises", "Weighted Pull Ups", "Face Pulls", "Incline Bench Press"], 'B': ["Leg Press", "Lat Pulldown", "Cable Row"], 'C': ["Bench Press (Main)", "Incline Bench Press", "Dumbbell Peck Fly", "Lateral Raises"] };
const variationMap = { 'B': { 1: ["Single Leg Curl", "Lying Leg Curl (Double)"] } };
const workoutNames = { 'A': "A (כתפיים-חזה-גב)", 'B': "B (רגליים-גב)", 'C': "C (חזה-כתפיים)", 'Freestyle': "Freestyle" };

// --- LOGIC ---
function haptic(t='light') { if(navigator.vibrate) navigator.vibrate(t==='light'?20:40); }
function playBeep(n=1) { 
    if(!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    for(let i=0; i<n; i++) setTimeout(() => {
        const o=audioContext.createOscillator(), g=audioContext.createGain();
        o.type='sine'; o.frequency.setValueAtTime(880, audioContext.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime+0.4);
        o.connect(g); g.connect(audioContext.destination); o.start(); o.stop(audioContext.currentTime+0.4);
    }, i*500);
}

async function initAudio() { 
    playBeep(1); haptic('medium'); 
    document.getElementById('audio-init-btn').style.background = "var(--success-gradient)";
    document.getElementById('audio-init-btn').innerHTML = "✅ מצב אימון פעיל";
    try { if(navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch(e){}
}

function navigate(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id !== 'ui-main') stopRestTimer();
    if(state.historyStack[state.historyStack.length-1] !== id) state.historyStack.push(id);
    document.getElementById('global-back').style.visibility = (id === 'ui-week') ? 'hidden' : 'visible';
}

function handleBackClick() {
    if(state.historyStack.length <= 1) return;
    const cur = state.historyStack.pop();
    if(cur === 'ui-main' && state.setIdx > 0) { state.log.pop(); state.setIdx--; initPickers(); state.historyStack.push('ui-main'); return; }
    const prev = state.historyStack[state.historyStack.length-1];
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(prev).classList.add('active');
    document.getElementById('global-back').style.visibility = (prev === 'ui-week') ? 'hidden' : 'visible';
}

function selectWeek(w) { state.week = w; navigate('ui-workout-type'); }
function selectWorkout(t) { state.type = t; state.exIdx = 0; state.log = []; state.completedExInSession = []; state.workoutStartTime = Date.now(); showConfirmScreen(); }

function showConfirmScreen() {
    const exName = workouts[state.type][state.exIdx];
    const exData = exerciseDatabase.find(e => e.name === exName);
    state.currentEx = JSON.parse(JSON.stringify(exData));
    state.currentExName = exData.name;
    document.getElementById('confirm-ex-name').innerText = exData.name;
    navigate('ui-confirm');
}

function confirmExercise(doEx) {
    if(!doEx) { state.log.push({skip:true, exName: state.currentExName}); state.exIdx++; checkFlow(); return; }
    if(state.currentEx.isCalc) setupCalculatedEx(); else startRecording();
}

function setupCalculatedEx() {
    const lastRM = StorageManager.getLastRM(state.currentExName) || state.currentEx.baseRM;
    const p = document.getElementById('rm-picker'); p.innerHTML = "";
    for(let i=state.currentEx.rmRange[0]; i<=state.currentEx.rmRange[1]; i+=2.5) {
        let o = new Option(i+" kg", i); if(i===lastRM) o.selected=true; p.add(o);
    }
    navigate('ui-1rm');
}

// MISSION 1: FIXED MAIN CALCULATION
function save1RM() {
    state.rm = parseFloat(document.getElementById('rm-picker').value);
    StorageManager.saveRM(state.currentExName, state.rm);
    const configs = {
        1: { p: [0.65, 0.75, 0.85, 0.75, 0.65], r: [5, 5, 5, 8, 10] },
        2: { p: [0.70, 0.80, 0.90, 0.80, 0.70, 0.70], r: [3, 3, 3, 8, 10, 10] },
        3: { p: [0.75, 0.85, 0.95, 0.85, 0.75, 0.75], r: [5, 3, 1, 8, 10, 10] }
    };
    const c = configs[state.week];
    const range = state.currentEx.manualRange;

    state.currentEx.sets = c.p.map((pct, i) => {
        let w = Math.round((state.rm * pct) / 2.5) * 2.5;
        if(range) w = Math.max(range.min, Math.min(range.max, w));
        return { w, r: c.r[i] };
    });
    startRecording();
}

function startRecording() { state.setIdx = 0; state.lastLoggedSet = null; navigate('ui-main'); initPickers(); }

function initPickers() {
    const target = state.currentEx.sets[state.setIdx];
    document.getElementById('ex-display-name').innerText = state.currentExName;
    document.getElementById('set-counter').innerText = `SET ${state.setIdx+1}/${state.currentEx.sets.length}`;
    document.getElementById('set-note').value = "";
    
    const hist = document.getElementById('last-set-info');
    if(state.lastLoggedSet) { hist.innerText = `אחרון: ${state.lastLoggedSet.w}kg x ${state.lastLoggedSet.r}`; hist.style.display='block'; }
    else hist.style.display='none';

    const wPick = document.getElementById('weight-picker'); wPick.innerHTML = "";
    const defW = target ? target.w : (StorageManager.getLastWeight(state.currentExName) || 0);
    for(let i=Math.max(0, defW-30); i<=defW+40; i+= (state.currentEx.step || 2.5)) {
        let o = new Option(i+" kg", i); if(i===defW) o.selected=true; wPick.add(o);
    }

    const rPick = document.getElementById('reps-picker'); rPick.innerHTML = "";
    const defR = target ? target.r : 8;
    for(let i=1; i<=25; i++) { let o = new Option(i, i); if(i===defR) o.selected=true; rPick.add(o); }

    const rirPick = document.getElementById('rir-picker'); rirPick.innerHTML = "";
    [0, 0.5, 1, 1.5, 2, 3].forEach(v => { let o = new Option(v||"Fail", v); if(v===2) o.selected=true; rirPick.add(o); });

    if(state.setIdx > 0) resetAndStartTimer();
}

function resetAndStartTimer() {
    stopRestTimer(); state.seconds = 0; state.startTime = Date.now();
    state.timerInterval = setInterval(() => {
        state.seconds = Math.floor((Date.now()-state.startTime)/1000);
        const m = Math.floor(state.seconds/60).toString().padStart(2,'0'), s = (state.seconds%60).toString().padStart(2,'0');
        document.getElementById('rest-timer').innerText = `${m}:${s}`;
        const prog = Math.min(state.seconds/90, 1);
        document.getElementById('timer-progress').style.strokeDashoffset = 283 - (prog*283);
        if(state.seconds === 90) playBeep(2);
    }, 1000);
}
function stopRestTimer() { clearInterval(state.timerInterval); }

// MISSION 2: NOTES FIELD
function nextStep() {
    const w = parseFloat(document.getElementById('weight-picker').value);
    const n = document.getElementById('set-note').value.trim();
    const entry = { exName: state.currentExName, w, r: parseInt(document.getElementById('reps-picker').value), rir: document.getElementById('rir-picker').value, note: n };
    state.log.push(entry); state.lastLoggedSet = entry;
    StorageManager.saveWeight(state.currentExName, w);
    if(state.setIdx < state.currentEx.sets.length-1) { state.setIdx++; initPickers(); }
    else navigate('ui-extra');
}

function handleExtra(bonus) {
    if(bonus) { state.setIdx++; state.currentEx.sets.push({...state.currentEx.sets[state.setIdx-1]}); initPickers(); navigate('ui-main'); }
    else { state.completedExInSession.push(state.currentExName); state.exIdx++; checkFlow(); }
}

function checkFlow() { if(state.exIdx < workouts[state.type].length) showConfirmScreen(); else navigate('ui-ask-extra'); }

function finish() {
    state.workoutDurationMins = Math.floor((Date.now()-state.workoutStartTime)/60000);
    const date = new Date().toLocaleDateString('he-IL');
    let txt = `GYMPRO SUMMARY | ${date} | ${state.workoutDurationMins}m\n\n`;
    let grouped = {};
    state.log.forEach(l => {
        if(!grouped[l.exName]) grouped[l.exName] = [];
        if(!l.skip) grouped[l.exName].push(`${l.w}kg x ${l.r} (RIR ${l.rir})${l.note ? ' *'+l.note+'*' : ''}`);
    });
    for(let ex in grouped) txt += `${ex}:\n${grouped[ex].join('\n')}\n\n`;
    document.getElementById('summary-area').innerText = txt;
    StorageManager.saveToArchive({ timestamp: Date.now(), date, type: workoutNames[state.type], duration: state.workoutDurationMins, summary: txt });
    navigate('ui-summary');
}

function copyResult() { navigator.clipboard.writeText(document.getElementById('summary-area').innerText).then(() => { alert("הועתק!"); location.reload(); }); }

// MISSION 3: UPGRADED ARCHIVE
function openArchive() {
    const list = document.getElementById('archive-list'); list.innerHTML = "";
    const history = StorageManager.getArchive();
    if(!history.length) list.innerHTML = "<p style='text-align:center; opacity:0.5;'>אין אימונים</p>";
    history.forEach(h => {
        const btn = document.createElement('button'); btn.className = "menu-card tall";
        btn.innerHTML = `<h3>${h.date}</h3><p>${h.type} (${h.duration} דק')</p>`;
        btn.onclick = () => { state.currentArchiveView = h; document.getElementById('archive-detail-content').innerText = h.summary; navigate('ui-archive-detail'); };
        list.appendChild(btn);
    });
    navigate('ui-archive');
}

function copyArchiveDetail() { navigator.clipboard.writeText(state.currentArchiveView.summary).then(() => alert("הועתק!")); }
function deleteCurrentArchiveItem() { if(confirm("למחוק?")) { StorageManager.deleteFromArchive(state.currentArchiveView.timestamp); openArchive(); } }

// UI Init
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.createElement('button'); btn.className = "action-card secondary"; btn.style.marginTop = "20px";
    btn.innerHTML = "<div class='card-icon'>📜</div><div class='card-text'>ארכיון אימונים</div>";
    btn.onclick = openArchive; document.getElementById('ui-week').appendChild(btn);
});
