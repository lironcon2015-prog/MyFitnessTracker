// --- נתונים ותשתיות ---
let state = {
    week: 1, type: '', rm: 100, exIdx: 0, setIdx: 0, log: [], currentEx: null,
    historyStack: ['ui-week'], timerInterval: null, seconds: 0, startTime: null,
    isArmPhase: false, armGroup: 'biceps', completedArmEx: [],
    workoutStartTime: null, workoutDurationMins: 0, lastLoggedSet: null,
    isFreestyle: false, currentBodyPart: null
};

const unilateralExercises = ["Dumbbell Peck Fly", "Lateral Raises", "Lateral Raises (DB)", "Single Leg Curl", "Dumbbell Bicep Curls", "Cable Fly", "Concentration Curls"];

const exerciseLibrary = {
    legs: [
        { name: "Squat", sets: [{w: 100, r: 8}, {w: 100, r: 8}, {w: 100, r: 8}], step: 2.5, minW: 60, maxW: 180 },
        { name: "Deadlift", sets: [{w: 100, r: 6}, {w: 100, r: 6}, {w: 100, r: 6}], step: 2.5, minW: 60, maxW: 220 },
        { name: "Leg Press", sets: [{w: 240, r: 10}, {w: 240, r: 10}], step: 10 },
        { name: "Leg Extension", sets: [{w: 60, r: 12}], step: 5 },
        { name: "Lying Leg Curl", sets: [{w: 50, r: 12}], step: 5 }
    ],
    chest: [
        { name: "Bench Press", sets: [{w: 80, r: 8}, {w: 80, r: 8}], step: 2.5, minW: 40, maxW: 140 },
        { name: "Incline DB Press", sets: [{w: 26, r: 10}, {w: 26, r: 10}], step: 2 },
        { name: "Cable Fly", sets: [{w: 12.5, r: 15}], step: 2.5 }
    ],
    back: [
        { name: "Lat Pulldown", sets: [{w: 70, r: 10}], step: 2.5 },
        { name: "Seated Row", sets: [{w: 60, r: 12}], step: 2.5 },
        { name: "Pull Ups", sets: [{w: 0, r: 8}], isBW: true }
    ],
    shoulders: [
        { name: "Overhead Press", sets: [{w: 50, r: 8}], step: 2.5 },
        { name: "Lateral Raises", sets: [{w: 12.5, r: 15}], step: 0.5 },
        { name: "Face Pulls", sets: [{w: 35, r: 15}], step: 2.5 }
    ]
};

const workouts = {
    'A': [
        { name: "Overhead Press (Main)", isCalc: true, baseRM: 77.5, rmRange: [60, 95] },
        { name: "Barbell Shrugs", sets: [{w: 140, r: 11}, {w: 140, r: 11}, {w: 140, r: 11}], step: 5 },
        { name: "Lateral Raises (DB)", sets: [{w: 12.5, r: 13}, {w: 12.5, r: 13}], step: 0.5 },
        { name: "Pull Ups Variation", hasVariations: true, variations: [
            { name: "Pull Ups (BW)", sets: [{w: 0, r: 8}, {w: 0, r: 8}], isBW: true },
            { name: "Weighted Pull Ups", sets: [{w: 5, r: 8}], step: 2.5 }
        ]}
    ],
    'B': [
        { name: "Leg Press", sets: [{w: 280, r: 8}, {w: 300, r: 8}], step: 5 },
        { name: "Leg Curl", hasVariations: true, variations: [
            { name: "Single Leg Curl", sets: [{w: 25, r: 8}], step: 2.5 },
            { name: "Lying Leg Curl", sets: [{w: 50, r: 10}], step: 5 }
        ]}
    ],
    'C': [
        { name: "Bench Press (Main)", isCalc: true, baseRM: 122.5, rmRange: [100, 160] },
        { name: "Chest Flyes", hasVariations: true, variations: [
            { name: "Dumbbell Peck Fly", sets: [{w: 14, r: 12}], step: 2 },
            { name: "Cable Fly", sets: [{w: 12.5, r: 12}], step: 2.5 }
        ]}
    ]
};

const armExercises = {
    biceps: [{ name: "DB Curls", sets: [{w: 14, r: 10}], step: 2 }, { name: "Hammer Curls", sets: [{w: 14, r: 10}], step: 2 }],
    triceps: [{ name: "Triceps Pushdown", sets: [{w: 35, r: 12}], step: 2.5 }, { name: "Skull Crushers", sets: [{w: 30, r: 10}], step: 2.5 }]
};

// --- פונקציות טכניות ---
let audioCtx;
function playBeep(times = 1) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    for(let i=0; i<times; i++) {
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.frequency.value = 880; gain.gain.value = 0.1;
            osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        }, i * 500);
    }
}

async function initAudio() {
    playBeep(1);
    const btn = document.getElementById('audio-init-btn');
    btn.innerText = "✅ סאונד פעיל"; btn.style.backgroundColor = "var(--success)";
    if ('wakeLock' in navigator) await navigator.wakeLock.request('screen').catch(()=>{});
}

function startRestTimer() {
    stopRestTimer();
    state.seconds = 0;
    const target = (state.exIdx === 0 && !state.isArmPhase) ? 120 : 90;
    state.startTime = Date.now();
    state.timerInterval = setInterval(() => {
        state.seconds = Math.floor((Date.now() - state.startTime) / 1000);
        const m = Math.floor(state.seconds / 60).toString().padStart(2, '0');
        const s = (state.seconds % 60).toString().padStart(2, '0');
        document.getElementById('rest-timer').innerText = `${m}:${s}`;
        document.getElementById('timer-bar').style.width = Math.min((state.seconds / target) * 100, 100) + "%";
        if (state.seconds === target) playBeep(2);
    }, 1000);
}

function stopRestTimer() { if (state.timerInterval) clearInterval(state.timerInterval); }

function navigate(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (state.historyStack[state.historyStack.length - 1] !== id) state.historyStack.push(id);
    document.getElementById('global-back').style.visibility = (id === 'ui-week') ? 'hidden' : 'visible';
    window.scrollTo(0,0);
}

function handleBackClick() {
    if (state.historyStack.length <= 1) return;
    const current = state.historyStack.pop(); 
    if (current === 'ui-main' && state.setIdx > 0) {
        state.log.pop(); state.setIdx--; initPickers();
        state.historyStack.push('ui-main'); // נשאר באותו מסך
        return;
    }
    const prev = state.historyStack.pop();
    navigate(prev);
}

// --- לוגיקת אימון ---
function selectWeek(w) { state.week = w; navigate('ui-workout-type'); }

function startFreestyle() {
    state.type = 'Freestyle'; state.isFreestyle = true; state.log = []; 
    state.workoutStartTime = Date.now();
    const grid = document.getElementById('body-parts-grid'); grid.innerHTML = "";
    Object.keys(exerciseLibrary).forEach(part => {
        const btn = document.createElement('button'); btn.className = "menu-item";
        btn.innerHTML = `<span>${part === 'legs' ? 'רגליים' : part === 'chest' ? 'חזה' : part === 'back' ? 'גב' : 'כתפיים'}</span><span>➔</span>`;
        btn.onclick = () => selectBodyPart(part);
        grid.appendChild(btn);
    });
    navigate('ui-body-part');
}

function selectBodyPart(part) {
    state.currentBodyPart = part;
    const opts = document.getElementById('freestyle-options'); opts.innerHTML = "";
    exerciseLibrary[part].forEach(ex => {
        const btn = document.createElement('button'); btn.className = "menu-item"; btn.innerText = ex.name;
        btn.onclick = () => { state.currentEx = JSON.parse(JSON.stringify(ex)); state.currentExName = ex.name; startRecording(); };
        opts.appendChild(btn);
    });
    navigate('ui-freestyle-list');
}

function continueFreestyleSamePart() { selectBodyPart(state.currentBodyPart); }

function selectWorkout(t) {
    state.type = t; state.isFreestyle = false; state.exIdx = 0; state.log = []; 
    state.workoutStartTime = Date.now();
    const ex = workouts[t][0];
    if (ex.isCalc) {
        document.getElementById('rm-title').innerText = ex.name;
        const p = document.getElementById('rm-picker'); p.innerHTML = "";
        for(let i=ex.rmRange[0]; i<=ex.rmRange[1]; i+=2.5) {
            let o = new Option(i + " ק\"ג", i); if(i === ex.baseRM) o.selected = true; p.add(o);
        }
        navigate('ui-1rm');
    } else showConfirmScreen();
}

function save1RM() { state.rm = parseFloat(document.getElementById('rm-picker').value); showConfirmScreen(); }

function showConfirmScreen() {
    document.getElementById('confirm-ex-name').innerText = workouts[state.type][state.exIdx].name;
    navigate('ui-confirm');
}

function confirmExercise(doEx) {
    if (!doEx) { state.log.push({ skip: true, exName: workouts[state.type][state.exIdx].name }); state.exIdx++; checkFlow(); return; }
    state.currentEx = JSON.parse(JSON.stringify(workouts[state.type][state.exIdx]));
    
    if (state.currentEx.isCalc) {
        const p = { 1: [0.65, 0.75, 0.85, 0.75, 0.65], 2: [0.70, 0.80, 0.90, 0.80, 0.70, 0.70], 3: [0.75, 0.85, 0.95, 0.85, 0.75, 0.75] }[state.week];
        const r = (state.week === 1) ? [5, 5, 5, 8, 10] : (state.week === 2) ? [3, 3, 3, 8, 10, 10] : [5, 3, 1, 8, 10, 10];
        state.currentEx.sets = p.map((pct, i) => ({ w: Math.round((state.rm * pct) / 2.5) * 2.5, r: r[i] || 10 }));
        state.currentExName = state.currentEx.name; startRecording();
    } else if (state.currentEx.hasVariations) {
        const opts = document.getElementById('variation-options'); opts.innerHTML = "";
        state.currentEx.variations.forEach(v => {
            const btn = document.createElement('button'); btn.className = "btn-secondary"; btn.innerText = v.name;
            btn.onclick = () => { state.currentExName = v.name; state.currentEx.sets = v.sets; state.currentEx.step = v.step || 2.5; startRecording(); };
            opts.appendChild(btn);
        });
        navigate('ui-variation');
    } else { state.currentExName = state.currentEx.name; startRecording(); }
}

function startRecording() { state.setIdx = 0; stopRestTimer(); navigate('ui-main'); initPickers(); }

function initPickers() {
    const target = state.currentEx.sets[state.setIdx] || state.currentEx.sets[state.currentEx.sets.length-1];
    document.getElementById('ex-display-name').innerText = state.currentExName;
    document.getElementById('set-counter').innerText = `סט ${state.setIdx + 1} מתוך ${state.currentEx.sets.length}`;
    document.getElementById('unilateral-note').style.display = unilateralExercises.some(u => state.currentExName.includes(u)) ? 'block' : 'none';

    if (state.setIdx > 0) { document.getElementById('timer-area').style.visibility = 'visible'; startRestTimer(); }
    else document.getElementById('timer-area').style.visibility = 'hidden';

    const wP = document.getElementById('weight-picker'); wP.innerHTML = "";
    const step = state.currentEx.step || 2.5;
    for(let i = Math.max(0, target.w-40); i <= target.w+40; i = parseFloat((i+step).toFixed(2))) {
        let o = new Option(i + " kg", i); if(i === target.w) o.selected = true; wP.add(o);
    }

    const rP = document.getElementById('reps-picker'); rP.innerHTML = "";
    for(let i=1; i<=25; i++) { let o = new Option(i, i); if(i === target.r) o.selected = true; rP.add(o); }

    const rirP = document.getElementById('rir-picker'); rirP.innerHTML = "";
    [0, 0.5, 1, 1.5, 2, 3, 4, 5].forEach(v => { let o = new Option(v, v); if(v === 2) o.selected = true; rirP.add(o); });
}

function nextStep() {
    state.log.push({
        exName: state.currentExName,
        w: parseFloat(document.getElementById('weight-picker').value),
        r: parseInt(document.getElementById('reps-picker').value),
        rir: document.getElementById('rir-picker').value
    });
    if (state.setIdx < state.currentEx.sets.length - 1) { state.setIdx++; initPickers(); }
    else navigate('ui-extra');
}

function handleExtra(extra) {
    if (extra) {
        state.setIdx++;
        state.currentEx.sets.push({...state.currentEx.sets[state.setIdx-1]});
        initPickers(); navigate('ui-main');
    } else {
        if (state.isArmPhase) { state.completedArmEx.push(state.currentExName); showArmSelection(); }
        else if (state.isFreestyle) navigate('ui-freestyle-interim');
        else { state.exIdx++; checkFlow(); }
    }
}

function checkFlow() {
    if (state.exIdx < workouts[state.type].length) showConfirmScreen();
    else navigate('ui-ask-arms');
}

function startArmWorkout() { state.isArmPhase = true; state.armGroup = 'biceps'; showArmSelection(); }

function showArmSelection() {
    const list = armExercises[state.armGroup];
    const rem = list.filter(ex => !state.completedArmEx.includes(ex.name));
    if (rem.length === 0) {
        if (state.armGroup === 'biceps') { state.armGroup = 'triceps'; showArmSelection(); }
        else finish(); return;
    }
    document.getElementById('arm-selection-title').innerText = (state.armGroup === 'biceps' ? "בחר תרגיל בייספס" : "בחר תרגיל טרייספס");
    const o = document.getElementById('arm-options'); o.innerHTML = "";
    rem.forEach(ex => {
        const b = document.createElement('button'); b.className = "btn-secondary"; b.innerText = ex.name;
        b.onclick = () => { state.currentEx = JSON.parse(JSON.stringify(ex)); state.currentExName = ex.name; startRecording(); };
        o.appendChild(b);
    });
    const skip = document.getElementById('btn-skip-arm-group');
    skip.innerText = state.armGroup === 'biceps' ? "דלג לטרייספס" : "סיים אימון";
    skip.onclick = () => { if(state.armGroup === 'biceps') { state.armGroup = 'triceps'; showArmSelection(); } else finish(); };
    navigate('ui-arm-selection');
}

function finishMainWorkout() { navigate('ui-ask-arms'); }

function finish() {
    state.workoutDurationMins = Math.floor((Date.now() - state.workoutStartTime) / 60000);
    navigate('ui-summary');
    let txt = `סיכום אימון ${state.type}\nמשך: ${state.workoutDurationMins} דקות\n\n`, grouped = {};
    state.log.forEach(e => {
        if (!grouped[e.exName]) grouped[e.exName] = { s: [], v: 0, skip: false };
        if (e.skip) grouped[e.exName].skip = true;
        else { grouped[e.exName].s.push(`${e.w}kg x ${e.r} (RIR ${e.rir})`); grouped[e.exName].v += (e.w * e.r); }
    });
    for (let n in grouped) {
        txt += `${n}:\n` + (grouped[n].skip ? "דלגתי\n\n" : grouped[n].s.join('\n') + `\nנפח: ${grouped[n].v} ק"ג\n\n`);
    }
    document.getElementById('summary-area').innerText = txt.trim();
}

function copyResult() {
    const el = document.createElement('textarea'); el.value = document.getElementById('summary-area').innerText;
    document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    alert("הסיכום הועתק!"); location.reload();
}

window.onbeforeunload = (e) => {
    if (state.log.length > 0 && document.getElementById('ui-summary').classList.contains('active') === false) {
        e.preventDefault(); e.returnValue = '';
    }
};
