const state = {
    week: 1, type: '', rm: 0, exIdx: 0, setIdx: 0, history: ['ui-week'],
    log: [], currentEx: null, timer: null, startTime: null, duration: 0,
    unilateral: ["Machine Row", "Dumbbell Peck Fly", "Lateral Raises", "Lateral Raises (DB)", "Single Leg Curl", "Dumbbell Bicep Curls", "Cable Fly"]
};

const workouts = {
    'A': [
        { name: "Bench Press", isCalc: true, baseRM: 122.5, range: [110, 160] },
        { name: "Incline Bench Press", sets: [9,9,9], weight: 65, step: 2.5 },
        { name: "Chest Flyes", vars: [
            { name: "Dumbbell Peck Fly", weight: 14, sets: [11,11,11], step: 2 },
            { name: "Machine Peck Fly", weight: 45, sets: [11,11,11], step: 5 },
            { name: "Cable Fly", weight: 12.5, sets: [11,11,11], step: 2.5 }
        ]},
        { name: "Lateral Raises", sets: [13,13,11], weight: 12.5, step: 0.5 },
        { name: "Face Pulls", sets: [13,13,15], weight: 40, step: 2.5 }
    ],
    'B': [
        { name: "Leg Press", sets: [8,8,7], weight: 300, step: 5 },
        { name: "Leg Curl", vars: [
            { name: "Single Leg Curl", weight: 25, sets: [8,6,8], step: 2.5 },
            { name: "Lying Leg Curl", weight: 55, sets: [8,6,8], step: 5 }
        ]},
        { name: "Vertical Pull", vars: [
            { name: "Lat Pulldown", weight: 75, sets: [10,10,11], step: 2.5 },
            { name: "Pull Ups", weight: 0, sets: [8,8,8], isBW: true }
        ]},
        { name: "Seated Row", vars: [
            { name: "Cable Row", weight: 65, sets: [10,10,12], step: 2.5 },
            { name: "Machine Row", weight: 50, sets: [10,10,12], step: 5 }
        ]},
        { name: "Straight Arm Pulldown", sets: [10,12,12], weight: 30, step: 2.5 }
    ],
    'C': [
        { name: "Overhead Press", isCalc: true, baseRM: 77.5, range: [65, 95] },
        { name: "Barbell Shrugs", sets: [11,11,11], weight: 140, step: 5 },
        { name: "Lateral Raises (DB)", sets: [13,13,11], weight: 12.5, step: 0.5 },
        { name: "Face Pull (Cable)", sets: [12,12,13], weight: 37.5, step: 2.5 },
        { name: "Pull Ups", weight: 0, sets: [8,7,7], isBW: true }
    ]
};

function navigate(id, push = true) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (push) state.history.push(id);
    document.getElementById('global-back').style.visibility = state.history.length > 1 ? 'visible' : 'hidden';
    window.scrollTo(0,0);
}

function handleBack() {
    if (state.history.length > 1) {
        state.history.pop();
        navigate(state.history[state.history.length-1], false);
    }
}

let audioCtx;
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    document.getElementById('audio-btn').innerText = "✅ סאונד מוכן";
    document.getElementById('audio-btn').style.background = "var(--success)";
}

function beep() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = 880; gain.gain.value = 0.1;
    osc.start(); osc.stop(audioCtx.currentTime + 0.2);
}

function selectWeek(w) { state.week = w; navigate('ui-workout-type'); }

function selectWorkout(t) {
    state.type = t; state.exIdx = 0; state.log = []; state.startTime = Date.now();
    const first = workouts[t][0];
    if (first.isCalc) {
        const p = document.getElementById('rm-picker'); p.innerHTML = "";
        for(let i=first.range[0]; i<=first.range[1]; i+=2.5) {
            p.add(new Option(i+" kg", i));
            if(i === first.baseRM) p.selectedIndex = p.options.length-1;
        }
        navigate('ui-1rm');
    } else { prepConfirm(); }
}

function save1RM() { state.rm = parseFloat(document.getElementById('rm-picker').value); prepConfirm(); }

function prepConfirm() {
    const ex = workouts[state.type][state.exIdx];
    document.getElementById('confirm-ex-name').innerText = ex.name;
    navigate('ui-confirm');
}

function startExercise(doIt) {
    if (!doIt) { state.log.push({ name: workouts[state.type][state.exIdx].name, skipped: true }); nextEx(); return; }
    const ex = workouts[state.type][state.exIdx];
    if (ex.vars) {
        const list = document.getElementById('var-list'); list.innerHTML = "";
        ex.vars.forEach(v => {
            const b = document.createElement('button'); b.className = "menu-item";
            b.innerText = v.name; b.onclick = () => { state.currentEx = {...v}; loadMain(); };
            list.appendChild(b);
        });
        navigate('ui-variation');
    } else {
        state.currentEx = ex.isCalc ? calcMain(ex) : {...ex};
        loadMain();
    }
}

function calcMain(ex) {
    const pct = {1: [0.65, 0.75, 0.85, 0.75, 0.65], 2: [0.7, 0.8, 0.9, 0.8, 0.7, 0.7], 3: [0.75, 0.85, 0.95, 0.85, 0.75, 0.75]}[state.week];
    const reps = {1: [3,3,5,8,10], 2: [3,3,3,8,10,10], 3: [3,3,3,8,10,10]}[state.week];
    return { name: ex.name, sets: reps, weights: pct.map(p => Math.round((state.rm * p)/2.5)*2.5) };
}

function loadMain() {
    state.setIdx = 0;
    updateUI();
    navigate('ui-main');
}

function updateUI() {
    const ex = state.currentEx;
    document.getElementById('active-ex-name').innerText = ex.name;
    document.getElementById('set-info').innerText = `SET ${state.setIdx + 1} / ${ex.sets.length}`;
    document.getElementById('uni-label').style.display = state.unilateral.includes(ex.name) ? "block" : "none";
    
    const wp = document.getElementById('w-picker'); wp.innerHTML = "";
    const startW = ex.weights ? ex.weights[state.setIdx] : ex.weight;
    for(let i=Math.max(0, startW-20); i<=startW+30; i+=(ex.step || 2.5)) {
        wp.add(new Option(i+" kg", i));
        if(i === startW) wp.selectedIndex = wp.options.length-1;
    }

    const rp = document.getElementById('r-picker'); rp.innerHTML = "";
    const targetR = ex.sets[state.setIdx];
    for(let i=1; i<=25; i++) {
        rp.add(new Option(i, i));
        if(i === targetR) rp.selectedIndex = i-1;
    }

    const rir = document.getElementById('rir-picker'); rir.innerHTML = "";
    [0,1,2,3,4].forEach(v => rir.add(new Option(v, v)));
    rir.selectedIndex = 2;

    document.getElementById('timer-box').style.display = "none";
    document.getElementById('submit-set-btn').style.display = "flex";
}

function submitSet() {
    if (!state.log[state.exIdx]) state.log[state.exIdx] = { name: state.currentEx.name, sets: [] };
    state.log[state.exIdx].sets.push({
        w: document.getElementById('w-picker').value,
        r: document.getElementById('r-picker').value,
        rir: document.getElementById('rir-picker').value
    });

    state.setIdx++;
    if (state.setIdx < state.currentEx.sets.length) {
        startTimer();
    } else {
        navigate('ui-extra');
    }
}

function startTimer() {
    document.getElementById('timer-box').style.display = "block";
    document.getElementById('submit-set-btn').style.display = "none";
    let sec = 0;
    const goal = state.exIdx === 0 ? 120 : 90;
    clearInterval(state.timer);
    state.timer = setInterval(() => {
        sec++;
        const m = Math.floor(sec/60).toString().padStart(2,'0');
        const s = (sec%60).toString().padStart(2,'0');
        document.getElementById('timer-val').innerText = `${m}:${s}`;
        if (sec === goal) { beep(); document.getElementById('timer-val').style.color = "var(--success)"; }
        if (sec > goal + 30) { updateUI(); clearInterval(state.timer); }
    }, 1000);
}

function addExtraSet() {
    state.currentEx.sets.push(state.currentEx.sets[state.currentEx.sets.length-1]);
    if (state.currentEx.weights) state.currentEx.weights.push(state.currentEx.weights[state.currentEx.weights.length-1]);
    updateUI();
    navigate('ui-main');
}

function endExercise() {
    clearInterval(state.timer);
    state.exIdx++;
    nextEx();
}

function nextEx() {
    if (state.exIdx < workouts[state.type].length) {
        prepConfirm();
    } else {
        showSummary();
    }
}

function showSummary() {
    state.duration = Math.round((Date.now() - state.startTime)/60000);
    let txt = `🏋️ *GymPro v8.1 - אימון ${state.type}*\nשבוע ${state.week} | ${state.duration} דקות\n\n`;
    state.log.forEach(ex => {
        if (ex.skipped) { txt += `❌ ${ex.name} (דלג)\n`; }
        else {
            txt += `*${ex.name}*\n`;
            ex.sets.forEach((s, i) => txt += `${i+1}. ${s.w}kg x ${s.r} (RIR ${s.rir})\n`);
        }
        txt += `\n`;
    });
    document.getElementById('summary-text').innerText = txt;
    navigate('ui-summary');
}

function copyResults() {
    const content = document.getElementById('summary-text').innerText;
    const tank = document.getElementById('clipboard-tank');
    tank.value = content;
    tank.select();
    tank.setSelectionRange(0, 99999);
    try {
        document.execCommand('copy');
        const btn = document.querySelector('#ui-summary .btn-primary');
        btn.innerText = "✅ הועתק!";
        setTimeout(() => btn.innerText = "📋 העתק לווצאפ", 2000);
    } catch (e) {
        console.error("Copy failed", e);
    }
}
