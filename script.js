/**
 * GYMPRO ELITE V12.2.2
 * - New Feature: Exercise Variations Swap (Split Menu)
 * - Database: Updated Pullups Group (Added Wide Grip, Weight Ranges)
 * - Logic: Robust substitution system independent of workout names
 */

// --- DEFAULT DATA (Factory Settings) ---
const defaultExercises = [
    // SHOULDERS (כתפיים)
    { name: "Overhead Press (Main)", muscles: ["כתפיים"], isCalc: true, baseRM: 60, rmRange: [50, 100], manualRange: {base: 50, min: 40, max: 80, step: 2.5} },
    { name: "Arnold Press", muscles: ["כתפיים"], sets: [{w: 15, r: 10}, {w: 15, r: 10}, {w: 15, r: 10}], step: 2.5 },
    { name: "Dumbbell Shoulder Press", muscles: ["כתפיים"], sets: [{w: 20, r: 10}, {w: 20, r: 10}, {w: 20, r: 10}], step: 2.5 },
    { name: "Machine Press", muscles: ["כתפיים"], sets: [{w: 40, r: 10}, {w: 40, r: 10}, {w: 40, r: 10}], step: 5 },
    { name: "Lateral Raises", muscles: ["כתפיים"], sets: [{w: 12.5, r: 13}, {w: 12.5, r: 13}, {w: 12.5, r: 11}], step: 0.5 },
    { name: "Cable Lateral Raises", muscles: ["כתפיים"], sets: [{w: 5, r: 15}, {w: 5, r: 15}, {w: 5, r: 15}], step: 1.25 },
    { name: "Face Pulls", muscles: ["כתפיים"], sets: [{w: 40, r: 13}, {w: 40, r: 13}, {w: 40, r: 15}], step: 2.5 },
    { name: "Rear Delt Fly (Dumbbells)", muscles: ["כתפיים"], sets: [{w: 10, r: 15}, {w: 10, r: 15}, {w: 10, r: 15}], step: 1 },
    { name: "Barbell Shrugs", muscles: ["כתפיים"], sets: [{w: 140, r: 11}, {w: 140, r: 11}, {w: 140, r: 11}], step: 5 },
    { name: "Front Raises", muscles: ["כתפיים"], sets: [{w: 10, r: 12}, {w: 10, r: 12}, {w: 10, r: 12}], step: 1 },

    // BACK (גב) - Updated with Pullup Group Specs
    { name: "Weighted Pull Ups", muscles: ["גב", "קליסטניקס"], sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}], step: 5, minW: 0, maxW: 60, isBW: true },
    { name: "Pull Ups", muscles: ["גב", "קליסטניקס"], isBW: true, sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}], step: 5, minW: 0, maxW: 60 },
    { name: "Chin Ups", muscles: ["גב", "קליסטניקס"], isBW: true, sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}], step: 5, minW: 0, maxW: 60 },
    { name: "Wide Grip Pull Ups", muscles: ["גב", "קליסטניקס"], isBW: true, sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}], step: 5, minW: 0, maxW: 60 },
    
    { name: "Lat Pulldown", muscles: ["גב"], sets: [{w: 75, r: 10}, {w: 75, r: 10}, {w: 75, r: 11}], step: 2.5 }, // Kept as original
    { name: "Cable Row", muscles: ["גב"], sets: [{w: 65, r: 10}, {w: 65, r: 10}, {w: 65, r: 12}], step: 2.5 },
    { name: "Machine Row", muscles: ["גב"], sets: [{w: 50, r: 10}, {w: 50, r: 10}, {w: 50, r: 12}], step: 5 },
    { name: "Straight Arm Pulldown", muscles: ["גב"], sets: [{w: 30, r: 10}, {w: 30, r: 12}, {w: 30, r: 12}], step: 2.5 },
    { name: "Back Extension", muscles: ["גב"], sets: [{w: 0, r: 12}, {w: 0, r: 12}, {w: 0, r: 12}], step: 5, minW: 0, maxW: 50, isBW: true },
    { name: "T-Bar Row", muscles: ["גב"], sets: [{w: 40, r: 10}, {w: 40, r: 10}, {w: 40, r: 10}], step: 5 },
    { name: "Single Arm Dumbbell Row", muscles: ["גב"], sets: [{w: 25, r: 10}, {w: 25, r: 10}, {w: 25, r: 10}], step: 2.5 },
    { name: "Rack Pulls", muscles: ["גב"], sets: [{w: 100, r: 5}, {w: 100, r: 5}, {w: 100, r: 5}], step: 5 },
    { name: "Reverse Fly (Machine)", muscles: ["גב", "כתפיים"], sets: [{w: 30, r: 12}, {w: 30, r: 12}, {w: 30, r: 12}], step: 2.5 },
    { name: "Bodyweight Rows", muscles: ["גב", "קליסטניקס"], isBW: true, sets: [{w: 0, r: 10}, {w: 0, r: 10}, {w: 0, r: 10}] },

    // CHEST (חזה)
    { name: "Bench Press (Main)", muscles: ["חזה"], isCalc: true, baseRM: 100, rmRange: [80, 150], manualRange: {base: 85, min: 60, max: 140, step: 2.5} },
    { name: "Incline Bench Press", muscles: ["חזה"], sets: [{w: 65, r: 9}, {w: 65, r: 9}, {w: 65, r: 9}], step: 2.5 },
    { name: "Dumbbell Peck Fly", muscles: ["חזה"], sets: [{w: 14, r: 11}, {w: 14, r: 11}, {w: 14, r: 11}], step: 2 },
    { name: "Machine Peck Fly", muscles: ["חזה"], sets: [{w: 45, r: 11}, {w: 45, r: 11}, {w: 45, r: 11}], step: 1 },
    { name: "Cable Fly", muscles: ["חזה"], sets: [{w: 12.5, r: 11}, {w: 12.5, r: 11}, {w: 12.5, r: 11}], step: 2.5 },
    { name: "Dips", muscles: ["חזה", "קליסטניקס"], isBW: true, sets: [{w: 0, r: 10}, {w: 0, r: 10}, {w: 0, r: 10}] },
    { name: "Decline Bench Press", muscles: ["חזה"], sets: [{w: 80, r: 8}, {w: 80, r: 8}, {w: 80, r: 8}], step: 2.5 },
    { name: "Dumbbell Bench Press", muscles: ["חזה"], sets: [{w: 30, r: 8}, {w: 30, r: 8}, {w: 30, r: 8}], step: 2.5 },
    { name: "Incline Dumbbell Bench Press", muscles: ["חזה"], sets: [{w: 25, r: 8}, {w: 25, r: 8}, {w: 25, r: 8}], step: 2.5 },

    // LEGS (רגליים)
    { name: "Leg Press", muscles: ["רגליים", "quads"], sets: [{w: 280, r: 8}, {w: 300, r: 8}, {w: 300, r: 7}], step: 5 },
    { name: "Squat", muscles: ["רגליים", "quads", "glutes"], sets: [{w: 100, r: 8}, {w: 100, r: 8}, {w: 100, r: 8}], step: 2.5, minW: 60, maxW: 180 },
    { name: "Deadlift", muscles: ["רגליים", "hamstrings"], sets: [{w: 100, r: 5}, {w: 100, r: 5}, {w: 100, r: 5}], step: 2.5, minW: 60, maxW: 180 },
    { name: "Romanian Deadlift", muscles: ["רגליים", "hamstrings"], sets: [{w: 100, r: 8}, {w: 100, r: 8}, {w: 100, r: 8}], step: 2.5, minW: 60, maxW: 180 },
    { name: "Sumo Deadlift", muscles: ["רגליים", "hamstrings", "glutes"], sets: [{w: 100, r: 5}, {w: 100, r: 5}, {w: 100, r: 5}], step: 2.5 },
    { name: "Single Leg Curl", muscles: ["רגליים", "hamstrings"], sets: [{w: 25, r: 8}, {w: 30, r: 6}, {w: 25, r: 8}], step: 2.5 },
    { name: "Lying Leg Curl (Double)", muscles: ["רגליים", "hamstrings"], sets: [{w: 50, r: 8}, {w: 60, r: 6}, {w: 50, r: 8}], step: 5 },
    { name: "Seated Leg Curl", muscles: ["רגליים", "hamstrings"], sets: [{w: 50, r: 10}, {w: 50, r: 10}, {w: 50, r: 10}], step: 5 }, 
    { name: "Seated Calf Raise", muscles: ["רגליים", "calves"], sets: [{w: 70, r: 10}, {w: 70, r: 10}, {w: 70, r: 12}], step: 5 },
    { name: "Standing Calf Raise", muscles: ["רגליים", "calves"], sets: [{w: 110, r: 10}, {w: 110, r: 10}, {w: 110, r: 12}], step: 10 },
    { name: "Bulgarian Split Squat", muscles: ["רגליים", "quads", "glutes"], sets: [{w: 10, r: 8}, {w: 10, r: 8}, {w: 10, r: 8}], step: 2.5 },
    { name: "Walking Lunges", muscles: ["רגליים", "quads", "glutes"], sets: [{w: 10, r: 10}, {w: 10, r: 10}, {w: 10, r: 10}], step: 1 },
    { name: "Hack Squat", muscles: ["רגליים", "quads"], sets: [{w: 50, r: 10}, {w: 50, r: 10}, {w: 50, r: 10}], step: 5 },
    { name: "Hip Thrust", muscles: ["רגליים", "glutes"], sets: [{w: 60, r: 10}, {w: 60, r: 10}, {w: 60, r: 10}], step: 5 },

    // ARMS (ידיים)
    { name: "Dumbbell Bicep Curls", muscles: ["ידיים", "biceps"], sets: [{w: 12, r: 8}, {w: 12, r: 8}, {w: 12, r: 8}], step: 0.5 },
    { name: "Barbell Bicep Curls", muscles: ["ידיים", "biceps"], sets: [{w: 25, r: 8}, {w: 25, r: 8}, {w: 25, r: 8}], step: 1 },
    { name: "Concentration Curls", muscles: ["ידיים", "biceps"], sets: [{w: 10, r: 10}, {w: 10, r: 10}, {w: 10, r: 10}], step: 0.5 },
    { name: "Hammer Curls", muscles: ["ידיים", "biceps"], sets: [{w: 12, r: 10}, {w: 12, r: 10}, {w: 12, r: 10}], step: 1 },
    { name: "Preacher Curls", muscles: ["ידיים", "biceps"], sets: [{w: 20, r: 10}, {w: 20, r: 10}, {w: 20, r: 10}], step: 1 },
    { name: "Reverse Grip Curl", muscles: ["ידיים", "biceps"], sets: [{w: 15, r: 10}, {w: 15, r: 10}, {w: 15, r: 10}], step: 1 },
    
    { name: "Triceps Pushdown", muscles: ["ידיים", "triceps"], sets: [{w: 35, r: 8}, {w: 35, r: 8}, {w: 35, r: 8}], step: 2.5 },
    { name: "Skullcrushers", muscles: ["ידיים", "triceps"], sets: [{w: 25, r: 8}, {w: 25, r: 8}, {w: 25, r: 8}], step: 2.5 },
    { name: "Overhead Triceps Extension (Cable)", muscles: ["ידיים", "triceps"], sets: [{w: 15, r: 12}, {w: 15, r: 12}, {w: 15, r: 12}], step: 1.25 },

    // CALISTHENICS
    { name: "Muscle Up", muscles: ["קליסטניקס"], isBW: true, sets: [{w: 0, r: 3}, {w: 0, r: 3}, {w: 0, r: 3}] },
    { name: "Pistol Squat", muscles: ["קליסטניקס", "רגליים", "quads"], isBW: true, sets: [{w: 0, r: 5}, {w: 0, r: 5}, {w: 0, r: 5}] },
    { name: "Handstand Pushups", muscles: ["קליסטניקס", "כתפיים"], isBW: true, sets: [{w: 0, r: 5}, {w: 0, r: 5}, {w: 0, r: 5}] },
    { name: "Front Lever", muscles: ["קליסטניקס", "גב"], isBW: true, sets: [{w: 0, r: 5}, {w: 0, r: 5}, {w: 0, r: 5}] },
    { name: "Diamond Pushups", muscles: ["קליסטניקס", "חזה", "ידיים", "triceps"], isBW: true, sets: [{w: 0, r: 12}, {w: 0, r: 12}, {w: 0, r: 12}] },
    { name: "L-Sit", muscles: ["קליסטניקס", "בטן"], isBW: true, sets: [{w: 0, r: 10}, {w: 0, r: 10}, {w: 0, r: 10}] }
];

// UPDATED DEFAULT WORKOUTS SCHEMA
const defaultWorkouts = {
    'A': [
        { name: "Overhead Press (Main)", isMain: true, sets: 0 },
        { name: "Barbell Shrugs", isMain: false, sets: 3 },
        { name: "Lateral Raises", isMain: false, sets: 3 },
        { name: "Weighted Pull Ups", isMain: false, sets: 3 },
        { name: "Face Pulls", isMain: false, sets: 3 },
        { name: "Incline Bench Press", isMain: false, sets: 3 }
    ],
    'B': [
        { name: "Leg Press", isMain: false, sets: 3 },
        { name: "Single Leg Curl", isMain: false, sets: 3 },
        { name: "Lat Pulldown", isMain: false, sets: 3 },
        { name: "Cable Row", isMain: false, sets: 3 },
        { name: "Seated Calf Raise", isMain: false, sets: 3 },
        { name: "Straight Arm Pulldown", isMain: false, sets: 3 }
    ],
    'C': [
        { name: "Bench Press (Main)", isMain: true, sets: 0 },
        { name: "Incline Bench Press", isMain: false, sets: 3 },
        { name: "Dumbbell Peck Fly", isMain: false, sets: 3 },
        { name: "Lateral Raises", isMain: false, sets: 3 },
        { name: "Face Pulls", isMain: false, sets: 3 }
    ]
};

// --- NEW SUBSTITUTION LOGIC (V12.2.2) ---
// Groups of exercises that can be swapped for one another
const substituteGroups = [
    // Chest
    ["Incline Bench Press", "Incline Dumbbell Bench Press"],
    ["Dumbbell Bench Press", "Machine Press"], // Fallback if regular Bench Press is not main
    ["Dumbbell Peck Fly", "Machine Peck Fly", "Cable Fly"],
    
    // Back (Pullups Group) - Lat Pulldown stays included
    ["Weighted Pull Ups", "Pull Ups", "Chin Ups", "Wide Grip Pull Ups", "Lat Pulldown"],
    // Back (Rows Group)
    ["Cable Row", "Machine Row", "T-Bar Row", "Single Arm Dumbbell Row", "Bodyweight Rows"],
    // Back (Isolation)
    ["Straight Arm Pulldown", "Weighted Pull Ups"], // Cross-variation

    // Shoulders
    ["Dumbbell Shoulder Press", "Arnold Press", "Machine Press"],
    ["Lateral Raises", "Cable Lateral Raises"],
    ["Face Pulls", "Rear Delt Fly (Dumbbells)", "Reverse Fly (Machine)"],

    // Legs
    ["Single Leg Curl", "Lying Leg Curl (Double)", "Seated Leg Curl"],
    ["Seated Calf Raise", "Standing Calf Raise"],
    ["Leg Press", "Hack Squat", "Bulgarian Split Squat", "Walking Lunges"],

    // Arms
    ["Dumbbell Bicep Curls", "Barbell Bicep Curls", "Concentration Curls", "Hammer Curls", "Preacher Curls", "Reverse Grip Curl"],
    ["Triceps Pushdown", "Skullcrushers", "Overhead Triceps Extension (Cable)", "Diamond Pushups"]
];

function getSubstitutes(exName) {
    const group = substituteGroups.find(g => g.includes(exName));
    return group ? group.filter(n => n !== exName) : [];
}

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
    firstArmGroup: null, 
    secondArmGroup: null,
    lastWorkoutDetails: {},
    archiveView: 'list',
    calendarOffset: 0,
    editingIndex: -1,
    freestyleFilter: 'all',
    // Dynamic Data Containers
    exercises: [],
    workouts: {}
};

// Manager Temporary State (Updated for Objects)
let managerState = {
    originalName: '',
    currentName: '',
    exercises: [], // Array of objects {name, isMain, sets}
    selectorFilter: 'all'
};

const unilateralKeywords = [
    "Dumbbell", "Cable Lateral", "Single", "Concentration", "Hammer", "Pistol", "Walking Lunges", "Bulgarian", "Kickback", "One Arm"
];

let audioContext;
let wakeLock = null;
let currentArchiveItem = null;
let selectedArchiveIds = new Set(); 

// --- LOCAL STORAGE MANAGER ---
const StorageManager = {
    KEY_WEIGHTS: 'gympro_weights',
    KEY_RM: 'gympro_rm',
    KEY_ARCHIVE: 'gympro_archive',
    KEY_DB_EXERCISES: 'gympro_db_exercises',
    KEY_DB_WORKOUTS: 'gympro_db_workouts',

    getData(key) {
        try { return JSON.parse(localStorage.getItem(key)); } 
        catch { return null; }
    },

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    initDB() {
        const storedEx = this.getData(this.KEY_DB_EXERCISES);
        const storedWo = this.getData(this.KEY_DB_WORKOUTS);

        if (storedEx && storedEx.length > 0) {
            state.exercises = storedEx;
            // UPDATE: Check if new V12.2.2 exercises exist in user DB, if not add them
            const missing = defaultExercises.filter(def => !state.exercises.find(e => e.name === def.name));
            if (missing.length > 0) {
                console.log("Adding missing exercises to DB:", missing);
                state.exercises = [...state.exercises, ...missing];
                this.saveData(this.KEY_DB_EXERCISES, state.exercises);
            }
        } else {
            state.exercises = JSON.parse(JSON.stringify(defaultExercises));
            this.saveData(this.KEY_DB_EXERCISES, state.exercises);
        }

        if (storedWo && Object.keys(storedWo).length > 0) {
            // MIGRATION LOGIC
            let hasChanges = false;
            Object.keys(storedWo).forEach(k => {
                if (storedWo[k].length > 0 && typeof storedWo[k][0] === 'string') {
                    console.log(`Migrating workout ${k} to new format...`);
                    storedWo[k] = storedWo[k].map(exName => ({
                        name: exName,
                        isMain: exName.includes("(Main)"), 
                        sets: 3
                    }));
                    hasChanges = true;
                }
            });
            
            state.workouts = storedWo;
            if (hasChanges) {
                this.saveData(this.KEY_DB_WORKOUTS, state.workouts);
            }
        } else {
            state.workouts = JSON.parse(JSON.stringify(defaultWorkouts));
            this.saveData(this.KEY_DB_WORKOUTS, state.workouts);
        }
    },

    resetFactory() {
        if(confirm("פעולה זו תאפס את כל התרגילים והאימונים לברירת המחדל, אך תשמור על היסטוריית הביצועים והמשקלים. האם להמשיך?")) {
            localStorage.removeItem(this.KEY_DB_EXERCISES);
            localStorage.removeItem(this.KEY_DB_WORKOUTS);
            location.reload();
        }
    },

    getLastWeight(exName) {
        const data = this.getData(this.KEY_WEIGHTS) || {};
        return data[exName] || null;
    },

    saveWeight(exName, weight) {
        const data = this.getData(this.KEY_WEIGHTS) || {};
        data[exName] = weight;
        this.saveData(this.KEY_WEIGHTS, data);
    },

    getLastRM(exName) {
        const data = this.getData(this.KEY_RM) || {};
        return data[exName] || null;
    },

    saveRM(exName, rmVal) {
        const data = this.getData(this.KEY_RM) || {};
        data[exName] = rmVal;
        this.saveData(this.KEY_RM, data);
    },

    saveToArchive(workoutObj) {
        let history = this.getData(this.KEY_ARCHIVE) || [];
        history.unshift(workoutObj);
        this.saveData(this.KEY_ARCHIVE, history);
    },

    getArchive() {
        return this.getData(this.KEY_ARCHIVE) || [];
    },
    
    deleteFromArchive(timestamp) {
        let history = this.getArchive();
        history = history.filter(h => h.timestamp !== timestamp);
        this.saveData(this.KEY_ARCHIVE, history);
    },

    getAllData() {
        return {
            weights: this.getData(this.KEY_WEIGHTS),
            rms: this.getData(this.KEY_RM),
            archive: this.getArchive()
        };
    },

    restoreData(dataObj) {
        if(dataObj.weights) this.saveData(this.KEY_WEIGHTS, dataObj.weights);
        if(dataObj.rms) this.saveData(this.KEY_RM, dataObj.rms);
        if(dataObj.archive) this.saveData(this.KEY_ARCHIVE, dataObj.archive);
    }
};

// --- INITIALIZATION ---
window.onload = () => {
    StorageManager.initDB();
    renderWorkoutMenu();
};

// --- CORE SYSTEMS ---

function haptic(type = 'light') {
    if (!("vibrate" in navigator)) return;
    try {
        if (type === 'light') navigator.vibrate(20); 
        else if (type === 'medium') navigator.vibrate(40);
        else if (type === 'success') navigator.vibrate([50, 50, 50]);
        else if (type === 'warning') navigator.vibrate([30, 30]);
    } catch(e) {}
}

function playBeep(times = 1) {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    for (let i = 0; i < times; i++) {
        setTimeout(() => {
            const o = audioContext.createOscillator();
            const g = audioContext.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(880, audioContext.currentTime);
            g.gain.setValueAtTime(0.3, audioContext.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            o.connect(g); g.connect(audioContext.destination);
            o.start(); o.stop(audioContext.currentTime + 0.4);
        }, i * 500);
    }
}

async function initAudio() {
    haptic('medium');
    playBeep(1);
    const btn = document.getElementById('audio-init-btn');
    btn.innerHTML = `<div class="card-icon">✅</div><div class="card-text">מצב אימון פעיל</div>`;
    btn.style.background = "var(--success-gradient)";
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {}
}

function navigate(id) {
    haptic('light');
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    if (id !== 'ui-main') stopRestTimer();
    if (state.historyStack[state.historyStack.length - 1] !== id) state.historyStack.push(id);
    
    document.getElementById('global-back').style.visibility = (id === 'ui-week') ? 'hidden' : 'visible';
}

function handleBackClick() {
    haptic('warning');
    if (state.historyStack.length <= 1) return;

    const currentScreen = state.historyStack[state.historyStack.length - 1];

    if (currentScreen === 'ui-main') {
        if (state.setIdx > 0) {
            deleteLastSet();
            return;
        } else {
            state.setIdx = 0;
            stopRestTimer();
            state.historyStack.pop(); 
            navigate('ui-confirm');
            return;
        }
    }

    if (currentScreen === 'ui-confirm') {
        if (state.log.length > 0 || state.completedExInSession.length > 0) {
            if(!confirm("האם לצאת מהאימון?")) return;
        }
        state.historyStack.pop(); 
        const prev = state.historyStack[state.historyStack.length - 1];
        navigate(prev); 
        return;
    }

    if (currentScreen === 'ui-workout-manager') { state.historyStack.pop(); navigate('ui-settings'); return; }
    if (currentScreen === 'ui-workout-editor') { 
        if(confirm("לצאת ללא שמירה?")) {
            state.historyStack.pop(); navigate('ui-workout-manager'); 
        }
        return; 
    }
    if (currentScreen === 'ui-exercise-selector') { state.historyStack.pop(); navigate('ui-workout-editor'); return; }
    if (currentScreen === 'ui-archive') { state.historyStack.pop(); navigate('ui-week'); return; }
    if (currentScreen === 'ui-archive-detail') { state.historyStack.pop(); navigate('ui-archive'); return; }
    if (currentScreen === 'ui-swap-list') { state.historyStack.pop(); navigate('ui-confirm'); return; }
    if (currentScreen === 'ui-settings') { state.historyStack.pop(); navigate('ui-week'); return; }

    state.historyStack.pop();
    const prevScreen = state.historyStack[state.historyStack.length - 1];
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(prevScreen).classList.add('active');
    document.getElementById('global-back').style.visibility = (prevScreen === 'ui-week') ? 'hidden' : 'visible';
}

function openSettings() {
    navigate('ui-settings');
}

function resetToFactorySettings() {
    StorageManager.resetFactory();
}

// --- DYNAMIC MAIN MENU ---
function renderWorkoutMenu() {
    const container = document.getElementById('workout-menu-container');
    container.innerHTML = "";
    
    Object.keys(state.workouts).forEach(key => {
        const btn = document.createElement('button');
        btn.className = "menu-card tall";
        
        let desc = "מותאם אישית";
        if (key === 'A') desc = "כתפיים - חזה - גב";
        if (key === 'B') desc = "רגליים - גב";
        if (key === 'C') desc = "חזה - כתפיים";
        
        const count = state.workouts[key].length;
        
        btn.innerHTML = `<h3>${key}</h3><p>${desc} (${count} תרגילים)</p>`;
        btn.onclick = () => selectWorkout(key);
        container.appendChild(btn);
    });
}

// --- WORKOUT MANAGER SYSTEM ---

function openWorkoutManager() {
    renderManagerList();
    navigate('ui-workout-manager');
}

function renderManagerList() {
    const list = document.getElementById('manager-list');
    list.innerHTML = "";
    
    const keys = Object.keys(state.workouts);
    if(keys.length === 0) {
        list.innerHTML = "<p style='text-align:center; color:var(--text-dim)'>אין תוכניות שמורות</p>";
        return;
    }

    keys.forEach(key => {
        const wo = state.workouts[key];
        const el = document.createElement('div');
        el.className = "manager-item";
        el.innerHTML = `
            <div class="manager-info">
                <h3>${key}</h3>
                <p>${wo.length} תרגילים</p>
            </div>
            <div class="manager-actions">
                <button class="icon-btn" onclick="duplicateWorkout('${key}')">📋</button>
                <button class="icon-btn" onclick="editWorkout('${key}')">✏️</button>
                <button class="icon-btn delete" onclick="deleteWorkout('${key}')">🗑️</button>
            </div>
        `;
        list.appendChild(el);
    });
}

function deleteWorkout(key) {
    if(confirm(`האם למחוק את תוכנית ${key}?`)) {
        delete state.workouts[key];
        StorageManager.saveData(StorageManager.KEY_DB_WORKOUTS, state.workouts);
        renderManagerList();
        renderWorkoutMenu(); 
    }
}

function duplicateWorkout(key) {
    const newName = key + " Copy";
    if (state.workouts[newName]) {
        alert("שם התוכנית כבר קיים");
        return;
    }
    state.workouts[newName] = JSON.parse(JSON.stringify(state.workouts[key]));
    StorageManager.saveData(StorageManager.KEY_DB_WORKOUTS, state.workouts);
    renderManagerList();
    renderWorkoutMenu();
}

function createNewWorkout() {
    managerState.originalName = '';
    managerState.currentName = 'New Plan';
    managerState.exercises = [];
    openEditorUI();
}

function editWorkout(key) {
    managerState.originalName = key;
    managerState.currentName = key;
    managerState.exercises = JSON.parse(JSON.stringify(state.workouts[key])); // Deep copy
    openEditorUI();
}

function openEditorUI() {
    document.getElementById('editor-workout-name').value = managerState.currentName;
    renderEditorList();
    navigate('ui-workout-editor');
}

function renderEditorList() {
    const list = document.getElementById('editor-list');
    list.innerHTML = "";
    
    managerState.exercises.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = "editor-row";
        
        let setControls = '';
        if (!item.isMain) {
            setControls = `
                <div class="set-selector">
                    <button class="set-btn" onclick="changeSetCount(${idx}, -1)">-</button>
                    <span class="set-val">${item.sets}</span>
                    <button class="set-btn" onclick="changeSetCount(${idx}, 1)">+</button>
                </div>
            `;
        } else {
            setControls = `<span style="font-size:0.8em; color:var(--text-dim); margin:0 5px;">1RM Auto</span>`;
        }

        row.innerHTML = `
            <div class="row-info">${idx + 1}. ${item.name}</div>
            <div class="editor-controls">
                <button class="crown-btn ${item.isMain ? 'active' : ''}" onclick="toggleMainStatus(${idx})">👑</button>
                ${setControls}
                <button class="control-icon-btn" onclick="moveExInEditor(${idx}, -1)">▲</button>
                <button class="control-icon-btn" onclick="moveExInEditor(${idx}, 1)">▼</button>
                <button class="control-icon-btn" onclick="removeExFromEditor(${idx})" style="color:#ff453a; border-color: rgba(255,69,58,0.3);">✕</button>
            </div>
        `;
        list.appendChild(row);
    });
}

function toggleMainStatus(idx) {
    managerState.exercises[idx].isMain = !managerState.exercises[idx].isMain;
    renderEditorList();
}

function changeSetCount(idx, delta) {
    let current = managerState.exercises[idx].sets;
    current += delta;
    if (current < 1) current = 1;
    if (current > 10) current = 10;
    managerState.exercises[idx].sets = current;
    renderEditorList();
}

function moveExInEditor(idx, dir) {
    if (idx + dir < 0 || idx + dir >= managerState.exercises.length) return;
    const temp = managerState.exercises[idx];
    managerState.exercises[idx] = managerState.exercises[idx + dir];
    managerState.exercises[idx + dir] = temp;
    renderEditorList();
}

function removeExFromEditor(idx) {
    managerState.exercises.splice(idx, 1);
    renderEditorList();
}

function saveWorkoutChanges() {
    const newName = document.getElementById('editor-workout-name').value.trim();
    if (!newName) { alert("נא להזין שם לתוכנית"); return; }
    if (managerState.exercises.length === 0) { alert("התוכנית ריקה!"); return; }

    if (newName !== managerState.originalName) {
        if (state.workouts[newName]) { alert("שם תוכנית זה כבר קיים, נא לבחור שם אחר"); return; }
        if (managerState.originalName) delete state.workouts[managerState.originalName];
    }
    
    state.workouts[newName] = managerState.exercises;
    StorageManager.saveData(StorageManager.KEY_DB_WORKOUTS, state.workouts);
    
    haptic('success');
    renderWorkoutMenu(); 
    navigate('ui-workout-manager');
    renderManagerList();
}

// --- SMART EXERCISE SELECTOR ---

function openExerciseSelector() {
    document.getElementById('selector-search').value = "";
    managerState.selectorFilter = 'all';
    updateSelectorChips();
    renderSelectorList();
    navigate('ui-exercise-selector');
}

function setSelectorFilter(filter, btn) {
    managerState.selectorFilter = filter;
    updateSelectorChips();
    renderSelectorList();
}

function updateSelectorChips() {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    const btns = document.querySelectorAll('#ui-exercise-selector .chip');
    btns.forEach(b => {
        const onClickFn = b.getAttribute('onclick');
        if (onClickFn.includes(`'${managerState.selectorFilter}'`)) {
            b.classList.add('active');
        }
    });
}

function filterSelector() {
    renderSelectorList();
}

function renderSelectorList() {
    const list = document.getElementById('selector-list');
    list.innerHTML = "";
    
    const searchVal = document.getElementById('selector-search').value.toLowerCase();
    
    const filtered = state.exercises.filter(ex => {
        const matchesFilter = managerState.selectorFilter === 'all' || ex.muscles.includes(managerState.selectorFilter);
        const matchesSearch = ex.name.toLowerCase().includes(searchVal);
        return matchesFilter && matchesSearch;
    });

    filtered.forEach(ex => {
        const btn = document.createElement('button');
        btn.className = "menu-card";
        btn.innerHTML = `<span>${ex.name}</span><div style="font-size:1.2em; color:var(--accent);">+</div>`;
        btn.onclick = () => {
            const newExObj = {
                name: ex.name,
                isMain: false,
                sets: 3 
            };
            managerState.exercises.push(newExObj);
            navigate('ui-workout-editor');
            renderEditorList();
        };
        list.appendChild(btn);
    });
}

// --- WORKOUT FLOW ---

function selectWeek(w) { state.week = w; navigate('ui-workout-type'); }

function selectWorkout(t) {
    state.type = t; state.exIdx = 0; state.log = []; 
    state.completedExInSession = []; state.isArmPhase = false; state.isFreestyle = false; state.isExtraPhase = false; state.isInterruption = false;
    state.workoutStartTime = Date.now();
    showConfirmScreen();
}

function startFreestyle() {
    state.type = 'Freestyle'; state.log = []; state.completedExInSession = [];
    state.isArmPhase = false; state.isFreestyle = true; state.isExtraPhase = false; state.isInterruption = false;
    state.workoutStartTime = Date.now();
    document.getElementById('btn-resume-flow').style.display = 'none';
    document.getElementById('btn-finish-extra').style.display = 'none';
    navigate('ui-muscle-select');
}

function showExerciseList(muscle) {
    state.currentMuscle = muscle;
    state.freestyleFilter = 'all'; 

    const chipContainer = document.getElementById('variation-chips');
    chipContainer.style.display = 'none';
    chipContainer.innerHTML = '';
    
    document.getElementById('variation-title').innerText = `תרגילי ${muscle}`;
    
    const options = document.getElementById('variation-options');
    options.innerHTML = "";

    if (state.isFreestyle) {
        const backBtn = document.createElement('button');
        backBtn.className = "btn-text";
        backBtn.style.color = "var(--accent)";
        backBtn.style.textAlign = "right";
        backBtn.style.marginBottom = "10px";
        backBtn.style.padding = "5px";
        backBtn.innerHTML = "🡠 חזור לבחירת קבוצת שריר";
        backBtn.onclick = () => navigate('ui-muscle-select'); 
        options.appendChild(backBtn);
    }

    if (muscle === 'רגליים') {
        chipContainer.style.display = 'flex';
        renderFreestyleChips(['all', 'quads', 'hamstrings', 'calves'], 'רגליים');
    } else if (muscle === 'ידיים') {
        chipContainer.style.display = 'flex';
        renderFreestyleChips(['all', 'biceps', 'triceps'], 'ידיים');
    }

    renderFreestyleList();
    navigate('ui-variation');
}

function renderFreestyleChips(filters, mainMuscle) {
    const container = document.getElementById('variation-chips');
    container.innerHTML = "";
    
    const labels = {
        'all': 'הכל', 'quads': 'ארבע ראשי', 'hamstrings': 'ירך אחורית', 'calves': 'תאומים',
        'biceps': 'יד קדמית', 'triceps': 'יד אחורית'
    };

    filters.forEach(f => {
        const btn = document.createElement('button');
        btn.className = `chip ${state.freestyleFilter === f ? 'active' : ''}`;
        btn.innerText = labels[f] || f;
        btn.onclick = () => {
            state.freestyleFilter = f;
            renderFreestyleChips(filters, mainMuscle); 
            renderFreestyleList(); 
        };
        container.appendChild(btn);
    });
}

function renderFreestyleList() {
    const options = document.getElementById('variation-options');
    const backBtn = options.querySelector('.btn-text');
    options.innerHTML = "";
    if(backBtn) options.appendChild(backBtn);

    let filtered = state.exercises.filter(ex => 
        ex.muscles.includes(state.currentMuscle) && 
        !state.completedExInSession.includes(ex.name)
    );

    if (state.freestyleFilter !== 'all') {
        filtered = filtered.filter(ex => ex.muscles.includes(state.freestyleFilter));
    }

    filtered.forEach(ex => {
        const btn = document.createElement('button');
        btn.className = "menu-card";
        btn.innerHTML = `<span>${ex.name}</span><div class="arrow">➔</div>`;
        btn.onclick = () => {
            state.currentEx = JSON.parse(JSON.stringify(ex));
            state.currentExName = ex.name;
            
            if(!state.currentEx.sets || state.currentEx.sets.length < 3) {
                 state.currentEx.sets = [{w:10, r:10}, {w:10, r:10}, {w:10, r:10}];
            }
            if (state.currentEx.isCalc) {
                state.currentEx.sets = Array(3).fill({w: state.currentEx.manualRange.base, r: 8});
                state.currentEx.step = state.currentEx.manualRange.step;
            }
            startRecording();
        };
        options.appendChild(btn);
    });
}

function getLastPerformance(exName) {
    const archive = StorageManager.getArchive();
    for (const item of archive) {
        if (item.details && item.details[exName]) {
            return {
                date: item.date,
                sets: item.details[exName].sets
            };
        }
    }
    return null;
}

function showConfirmScreen(forceExName = null) {
    let exName = forceExName;
    let currentPlanItem = null;

    if (!exName) {
        // Updated flow - no auto-variation check
        currentPlanItem = state.workouts[state.type][state.exIdx];
        exName = currentPlanItem.name;
    }
    
    const exData = state.exercises.find(e => e.name === exName);
    if (!exData) {
        alert("שגיאה: התרגיל לא נמצא במאגר (אולי נמחק?).");
        return;
    }

    state.currentEx = JSON.parse(JSON.stringify(exData));
    state.currentExName = exData.name;
    document.getElementById('confirm-ex-name').innerText = exData.name;
    
    const configDiv = document.getElementById('confirm-ex-config');
    if (currentPlanItem) {
        if (currentPlanItem.isMain) {
            configDiv.innerHTML = "👑 תרגיל Main (מחושב 1RM)";
        } else {
            configDiv.innerHTML = `תוכנית: ${currentPlanItem.sets} סטים`;
        }
        configDiv.style.display = 'block';
    } else {
        configDiv.style.display = 'none';
    }

    const intBtn = document.getElementById('btn-interruption');
    if (intBtn) intBtn.style.display = (state.exIdx > 0) ? 'block' : 'none';
    const swapBtn = document.getElementById('btn-swap-confirm');
    if (!state.isFreestyle && !state.isExtraPhase && !state.isInterruption && !state.isArmPhase) {
        swapBtn.style.display = 'flex';
    } else {
        swapBtn.style.display = 'none';
    }

    const historyContainer = document.getElementById('history-container');
    historyContainer.innerHTML = "";
    
    const history = getLastPerformance(exName);
    if (history) {
        let historyListHtml = "";
        history.sets.forEach((setStr, idx) => {
            let w = "", r = "", rir = "";
            try {
                const parts = setStr.split('x');
                w = parts[0] ? parts[0].trim() : "-";
                if (parts[1]) {
                    const sub = parts[1].split('(');
                    r = sub[0].trim();
                    if (sub[1]) {
                        rir = sub[1].replace(')', '').trim(); 
                    }
                }
            } catch (e) { w = setStr; }

            historyListHtml += `
            <div class="history-item">
                <span style="color:var(--text-dim); font-size:0.9em; width:30px;">#${idx + 1}</span>
                <span style="font-weight:600; color:white; flex:1; text-align:center;">${w}</span>
                <span style="font-weight:600; color:white; flex:1; text-align:center;">${r}</span>
                <span style="font-size:0.8em; color:var(--accent); width:60px; text-align:left;">${rir}</span>
            </div>`;
        });

        const historyCard = `
            <div class="glass-card compact" style="width:100%; box-sizing:border-box; padding: 15px;">
                <div style="font-size:0.85em; color:var(--text-dim); margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px; text-align:right;">
                    📅 ביצוע אחרון: ${history.date}
                </div>
                <div class="history-list">
                    ${historyListHtml}
                </div>
            </div>
        `;
        historyContainer.innerHTML = historyCard;
    }

    navigate('ui-confirm');
}

function confirmExercise(doEx) {
    if (!doEx) { state.log.push({ skip: true, exName: state.currentExName }); state.completedExInSession.push(state.currentExName); checkFlow(); return; }
    
    let isMain = state.currentEx.isCalc; 
    let targetSets = null;

    if (!state.isFreestyle && !state.isExtraPhase && !state.isInterruption && !state.isArmPhase) {
        const planItem = state.workouts[state.type][state.exIdx];
        if (planItem) {
            isMain = planItem.isMain;
            targetSets = planItem.sets;
        }
    }

    if (isMain) {
        state.currentEx.isCalc = true; 
        setupCalculatedEx(); 
    } else {
        if (targetSets && targetSets > 0) {
            resizeSets(targetSets);
        }
        startRecording();
    }
}

function resizeSets(count) {
    const currentSets = state.currentEx.sets;
    const templateSet = currentSets.length > 0 ? currentSets[currentSets.length - 1] : {w: 10, r: 10};
    
    if (count > currentSets.length) {
        while (currentSets.length < count) {
            currentSets.push({...templateSet});
        }
    } else if (count < currentSets.length) {
        state.currentEx.sets = currentSets.slice(0, count);
    }
}

function setupCalculatedEx() {
    document.getElementById('rm-title').innerText = `${state.currentExName} 1RM`;
    const lastRM = StorageManager.getLastRM(state.currentExName);
    
    const baseRM = state.currentEx.baseRM || 50; 
    const rmRange = state.currentEx.rmRange || [20, 150]; 
    
    const defaultRM = lastRM ? lastRM : baseRM;
    const minRM = rmRange[0];
    const maxRM = rmRange[1];
    
    const p = document.getElementById('rm-picker'); p.innerHTML = "";
    for(let i = minRM; i <= maxRM; i += 2.5) {
        let o = new Option(i + " kg", i); if(i === defaultRM) o.selected = true; p.add(o);
    }
    navigate('ui-1rm');
}

function save1RM() {
    state.rm = parseFloat(document.getElementById('rm-picker').value);
    StorageManager.saveRM(state.currentExName, state.rm);
    let percentages = []; let reps = [];
    if (state.week === 1) { percentages = [0.65, 0.75, 0.85, 0.75, 0.65]; reps = [5, 5, 5, 8, 10]; } 
    else if (state.week === 2) { percentages = [0.70, 0.80, 0.90, 0.80, 0.70, 0.70]; reps = [3, 3, 3, 8, 10, 10]; } 
    else if (state.week === 3) { percentages = [0.75, 0.85, 0.95, 0.85, 0.75, 0.75]; reps = [5, 3, 1, 8, 10, 10]; }
    state.currentEx.sets = percentages.map((pct, i) => ({ w: Math.round((state.rm * pct) / 2.5) * 2.5, r: reps[i] }));
    startRecording();
}

function startRecording() { 
    state.setIdx = 0; 
    state.lastLoggedSet = null; 
    document.getElementById('action-panel').style.display = 'none';
    document.getElementById('btn-submit-set').style.display = 'block';
    navigate('ui-main'); 
    initPickers(); 
}

function isUnilateral(exName) {
    return unilateralKeywords.some(keyword => exName.includes(keyword));
}

function initPickers() {
    const target = state.currentEx.sets[state.setIdx];
    document.getElementById('ex-display-name').innerText = state.currentExName;
    document.getElementById('set-counter').innerText = `SET ${state.setIdx + 1}/${state.currentEx.sets.length}`;
    document.getElementById('set-notes').value = '';
    const hist = document.getElementById('last-set-info');
    if (state.lastLoggedSet) {
        hist.innerText = `סט אחרון: ${state.lastLoggedSet.w}kg x ${state.lastLoggedSet.r} (RIR ${state.lastLoggedSet.rir})`;
        hist.style.display = 'block';
    } else hist.style.display = 'none';
    
    const isUni = isUnilateral(state.currentExName);
    document.getElementById('unilateral-note').style.display = isUni ? 'block' : 'none';
    
    const isHeavy = ["Squat", "Deadlift", "Bench Press", "Overhead Press"].some(k => state.currentExName.includes(k));
    const btnWarmup = document.getElementById('btn-warmup');
    btnWarmup.style.display = (state.setIdx === 0 && isHeavy) ? 'block' : 'none';
    
    const timerArea = document.getElementById('timer-area');
    if (state.setIdx > 0 && document.getElementById('action-panel').style.display === 'none') { 
        timerArea.style.visibility = 'visible'; 
        resetAndStartTimer(); 
    } else { 
        timerArea.style.visibility = 'hidden'; 
        stopRestTimer(); 
    }

    const skipBtn = document.getElementById('btn-skip-exercise');
    skipBtn.style.display = (state.setIdx === 0) ? 'none' : 'block';

    const wPick = document.getElementById('weight-picker'); wPick.innerHTML = "";
    const step = state.currentEx.step || 2.5;
    const savedWeight = StorageManager.getLastWeight(state.currentExName);
    let defaultW; let currentR;
    if (state.currentEx.isCalc && target) { defaultW = target.w; currentR = target.r; } 
    else {
        defaultW = state.lastLoggedSet ? state.lastLoggedSet.w : (state.setIdx === 0 && savedWeight ? savedWeight : (target ? target.w : 0));
        currentR = state.lastLoggedSet ? state.lastLoggedSet.r : (target ? target.r : 8);
    }
    
    let minW = Math.max(0, defaultW - 40); 
    let maxW = defaultW + 50;

    // Apply strict weight limits if defined
    if (state.currentEx.minW !== undefined) minW = Math.max(state.currentEx.minW, minW);
    if (state.currentEx.maxW !== undefined) maxW = Math.min(state.currentEx.maxW, maxW);
    
    // Ensure defaultW is within range to avoid visual bug
    if (defaultW < minW) minW = defaultW;
    if (defaultW > maxW) maxW = defaultW;

    for(let i = minW; i <= maxW; i = parseFloat((i + step).toFixed(2))) {
        let o = new Option(i + " kg", i); if(i === defaultW) o.selected = true; wPick.add(o);
    }
    const rPick = document.getElementById('reps-picker'); rPick.innerHTML = "";
    for(let i = 1; i <= 30; i++) { let o = new Option(i, i); if(i === currentR) o.selected = true; rPick.add(o); }
    const rirPick = document.getElementById('rir-picker'); rirPick.innerHTML = "";
    [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5].forEach(v => {
        let o = new Option(v === 0 ? "Fail" : v, v); if(v === 2) o.selected = true; rirPick.add(o);
    });
}

function calcWarmup() {
    const targetW = parseFloat(document.getElementById('weight-picker').value);
    const list = document.getElementById('warmup-list'); list.innerHTML = "";
    const percentages = [0, 0.4, 0.6, 0.8];
    percentages.forEach((pct, idx) => {
        let w; let reps;
        if(idx === 0) { w = 20; reps = 10; }
        else {
            w = Math.round((targetW * pct) / 2.5) * 2.5;
            if (w < 20) w = 20;
            reps = idx === 1 ? 5 : (idx === 2 ? 3 : 2);
        }
        if (w >= targetW) return;
        const row = document.createElement('div'); row.className = "warmup-row";
        row.innerHTML = `<span>סט ${idx + 1}</span><span>${w}kg x ${reps}</span>`;
        list.appendChild(row);
    });
    document.getElementById('warmup-modal').style.display = 'flex';
}

function closeWarmup() { document.getElementById('warmup-modal').style.display = 'none'; }
function markWarmupDone() { state.log.push({ exName: state.currentExName, isWarmup: true }); closeWarmup(); }

// --- REWRITTEN SWAP MENU (V12.2.2) ---
function openSwapMenu() {
    const container = document.getElementById('swap-container'); 
    container.innerHTML = "";
    
    const workoutList = state.workouts[state.type]; if (!workoutList) return;

    // 1. VARIATIONS SECTION (Replaces current exercise in-place)
    const variations = getSubstitutes(state.currentExName).filter(name => !state.completedExInSession.includes(name));
    
    if (variations.length > 0) {
        const titleVar = document.createElement('div');
        titleVar.className = "section-label";
        titleVar.innerText = `וריאציות (מחליף את הנוכחי)`;
        container.appendChild(titleVar);

        variations.forEach(vName => {
            const btn = document.createElement('button'); 
            btn.className = "menu-card"; 
            btn.innerHTML = `<span>${vName}</span><div class="arrow">➔</div>`;
            btn.onclick = () => {
                // Swap logic: update state and reload confirm screen
                const newExData = state.exercises.find(e => e.name === vName);
                if (newExData) {
                    state.currentExName = vName;
                    showConfirmScreen(vName);
                }
            };
            container.appendChild(btn);
        });
    }

    // 2. REORDER SECTION (Skip/Jump to other exercise)
    const titleOrder = document.createElement('div');
    titleOrder.className = "section-label";
    titleOrder.innerText = `שאר האימון (שינוי סדר)`;
    titleOrder.style.marginTop = "20px";
    container.appendChild(titleOrder);

    const remaining = workoutList.filter(item => !state.completedExInSession.includes(item.name) && item.name !== state.currentExName);
    
    if (remaining.length === 0) {
        const empty = document.createElement('p');
        empty.style.textAlign = 'center';
        empty.style.color = 'var(--text-dim)';
        empty.innerText = 'אין תרגילים נוספים להחלפה';
        container.appendChild(empty);
    } else {
        remaining.forEach(item => {
            const btn = document.createElement('button'); 
            btn.className = "menu-card"; 
            btn.innerHTML = `<span>${item.name}</span><div class="arrow">➔</div>`;
            btn.onclick = () => { 
                state.exIdx = state.workouts[state.type].findIndex(x => x.name === item.name); 
                showConfirmScreen(); 
            };
            container.appendChild(btn);
        });
    }

    navigate('ui-swap-list');
}

function resetAndStartTimer() {
    stopRestTimer(); state.seconds = 0; state.startTime = Date.now();
    const target = (state.exIdx === 0 && !state.isArmPhase && !state.isFreestyle && !state.isExtraPhase && !state.isInterruption) ? 120 : 90;
    const circle = document.getElementById('timer-progress'); const text = document.getElementById('rest-timer');
    text.innerText = "00:00"; circle.style.strokeDashoffset = 283;
    state.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        state.seconds = elapsed;
        const mins = Math.floor(state.seconds / 60).toString().padStart(2, '0');
        const secs = (state.seconds % 60).toString().padStart(2, '0');
        text.innerText = `${mins}:${secs}`;
        const progress = Math.min(state.seconds / target, 1);
        circle.style.strokeDashoffset = 283 - (progress * 283);
        if (state.seconds === target) playBeep(2);
    }, 100); 
}

function stopRestTimer() { if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; } }

function getNextExerciseName() {
    if (state.isInterruption) return "חזרה למסלול המקורי";
    if (state.isExtraPhase) return "בחירת תרגיל נוסף";
    if (state.isArmPhase) return "תרגיל ידיים הבא / סיום";

    const workoutList = state.workouts[state.type];
    if (!workoutList) return "סיום אימון";

    for (let i = 0; i < workoutList.length; i++) {
        const defaultName = workoutList[i].name;
        // Cleaned old variation checks
        let isDone = state.completedExInSession.includes(defaultName);
        
        if (!isDone && defaultName !== state.currentExName && !state.completedExInSession.includes(state.currentExName)) {
             if (i > state.exIdx) return defaultName; 
        }
    }
    if (state.exIdx < workoutList.length - 1) {
         return workoutList[state.exIdx + 1].name;
    }
    return "סיום אימון / תוספות";
}

function nextStep() {
    haptic('light');
    const wVal = parseFloat(document.getElementById('weight-picker').value);
    const noteVal = document.getElementById('set-notes').value.trim();
    const entry = { exName: state.currentExName, w: wVal, r: parseInt(document.getElementById('reps-picker').value), rir: document.getElementById('rir-picker').value, note: noteVal };
    StorageManager.saveWeight(state.currentExName, wVal);
    state.log.push(entry); state.lastLoggedSet = entry;

    if (state.setIdx < state.currentEx.sets.length - 1) { 
        state.setIdx++; 
        initPickers(); 
    } else { 
        haptic('medium'); 
        document.getElementById('btn-submit-set').style.display = 'none';
        document.getElementById('btn-skip-exercise').style.display = 'none';
        
        document.getElementById('action-panel').style.display = 'block';
        const nextName = getNextExerciseName();
        document.getElementById('next-ex-preview').innerText = `הבא בתור: ${nextName}`;
        stopRestTimer();
        document.getElementById('timer-area').style.visibility = 'hidden';
    }
}

function skipCurrentExercise() {
    if(confirm("לדלג על תרגיל זה ולעבור לבא?")) {
        state.log.push({ skip: true, exName: state.currentExName });
        finishCurrentExercise();
    }
}

function addExtraSet() {
    state.setIdx++;
    state.currentEx.sets.push({...state.currentEx.sets[state.setIdx-1]});
    document.getElementById('action-panel').style.display = 'none';
    document.getElementById('btn-submit-set').style.display = 'block';
    initPickers();
    document.getElementById('timer-area').style.visibility = 'visible'; 
    resetAndStartTimer();
}

function finishCurrentExercise() {
    state.historyStack = state.historyStack.filter(s => s !== 'ui-main');
    if (!state.completedExInSession.includes(state.currentExName)) state.completedExInSession.push(state.currentExName);
    
    if (state.isInterruption) { state.isInterruption = false; navigate('ui-confirm'); } 
    else if (state.isExtraPhase) { navigate('ui-ask-extra'); } 
    else if (state.isArmPhase) { showArmSelection(); } 
    else if (state.isFreestyle) { showExerciseList(state.currentMuscle); } 
    else { checkFlow(); }
}

function checkFlow() {
    const workoutList = state.workouts[state.type];
    let foundNext = false;

    for (let i = 0; i < workoutList.length; i++) {
        const defaultName = workoutList[i].name;
        // Cleaned old variation checks
        let isDone = state.completedExInSession.includes(defaultName);

        if (!isDone) {
            state.exIdx = i;
            showConfirmScreen();
            foundNext = true;
            break;
        }
    }

    if (!foundNext) {
        navigate('ui-ask-extra');
    }
}

function interruptWorkout() {
    state.isInterruption = true;
    document.getElementById('btn-resume-flow').style.display = 'flex';
    document.getElementById('btn-finish-extra').style.display = 'none';
    navigate('ui-muscle-select');
}

function resumeWorkout() { state.isInterruption = false; navigate('ui-confirm'); }
function startExtraPhase() { state.isExtraPhase = true; document.getElementById('btn-resume-flow').style.display = 'none'; document.getElementById('btn-finish-extra').style.display = 'block'; navigate('ui-muscle-select'); }
function finishExtraPhase() { navigate('ui-ask-arms'); }

function startArmWorkout() { 
    state.isArmPhase = true; 
    document.getElementById('arm-selection-title').innerText = "מה להתחיל?";
    const opts = document.getElementById('arm-options'); opts.innerHTML = "";
    const btnBi = document.createElement('button'); btnBi.className = "menu-card"; btnBi.innerHTML = `<span>יד קדמית (Biceps)</span><div class="arrow">➔</div>`;
    btnBi.onclick = () => { state.armGroup = 'biceps'; state.firstArmGroup = 'biceps'; state.secondArmGroup = 'triceps'; showArmSelection(); };
    const btnTri = document.createElement('button'); btnTri.className = "menu-card"; btnTri.innerHTML = `<span>יד אחורית (Triceps)</span><div class="arrow">➔</div>`;
    btnTri.onclick = () => { state.armGroup = 'triceps'; state.firstArmGroup = 'triceps'; state.secondArmGroup = 'biceps'; showArmSelection(); };
    opts.appendChild(btnBi); opts.appendChild(btnTri);
    document.getElementById('btn-skip-arm-group').style.display = 'none';
    navigate('ui-arm-selection');
}

function showArmSelection() {
    const list = state.exercises.filter(ex => ex.muscles.includes(state.armGroup));
    const remaining = list.filter(ex => !state.completedExInSession.includes(ex.name));
    if (remaining.length === 0) {
        if (state.armGroup === state.firstArmGroup) { state.armGroup = state.secondArmGroup; showArmSelection(); } 
        else { finish(); }
        return;
    }
    const isBiceps = state.armGroup === 'biceps';
    document.getElementById('arm-selection-title').innerText = isBiceps ? "בחר בייספס" : "בחר טרייספס";
    const opts = document.getElementById('arm-options'); opts.innerHTML = "";
    remaining.forEach(ex => {
        const btn = document.createElement('button'); btn.className = "menu-card"; btn.innerText = ex.name;
        btn.onclick = () => { state.currentEx = JSON.parse(JSON.stringify(ex)); state.currentExName = ex.name; state.currentEx.sets = [ex.sets[0], ex.sets[0], ex.sets[0]]; startRecording(); };
        opts.appendChild(btn);
    });
    const skipBtn = document.getElementById('btn-skip-arm-group'); skipBtn.style.display = 'block';
    if (state.armGroup === state.firstArmGroup) {
        skipBtn.innerText = isBiceps ? "דלג לטרייספס" : "דלג לבייספס";
        skipBtn.onclick = () => { state.armGroup = state.secondArmGroup; showArmSelection(); };
    } else {
        skipBtn.innerText = "סיים אימון"; skipBtn.onclick = () => finish();
    }
    navigate('ui-arm-selection');
}

function finish() {
    haptic('success');
    state.workoutDurationMins = Math.floor((Date.now() - state.workoutStartTime) / 60000);
    navigate('ui-summary');
    
    document.getElementById('summary-note').value = "";
    
    const workoutDisplayName = state.type; 
    const dateStr = new Date().toLocaleDateString('he-IL');
    let summaryText = `GYMPRO ELITE SUMMARY\n${workoutDisplayName} | ${dateStr} | ${state.workoutDurationMins}m\n\n`;
    let grouped = {};
    
    state.log.forEach(e => {
        if (!grouped[e.exName]) grouped[e.exName] = { sets: [], vol: 0, hasWarmup: false };
        if (e.isWarmup) grouped[e.exName].hasWarmup = true;
        else if (!e.skip) {
            let weightStr = `${e.w}kg`;
            if (isUnilateral(e.exName)) {
                weightStr += ` (יד אחת)`;
            }

            let setStr = `${weightStr} x ${e.r} (RIR ${e.rir})`;
            if (e.note) setStr += ` | Note: ${e.note}`;
            grouped[e.exName].sets.push(setStr); grouped[e.exName].vol += (e.w * e.r);
        }
    });

    for (let ex in grouped) { 
        summaryText += `${ex} (Vol: ${grouped[ex].vol}kg):\n`;
        if (grouped[ex].hasWarmup) summaryText += `🔥 Warmup Completed\n`;
        summaryText += `${grouped[ex].sets.join('\n')}\n\n`; 
    }
    
    document.getElementById('summary-area').innerText = summaryText.trim();
    state.lastWorkoutDetails = grouped;
}

function copyResult() {
    let text = document.getElementById('summary-area').innerText;
    const userNote = document.getElementById('summary-note').value.trim();
    if (userNote) {
        text += `\n\n📝 הערות כלליות: ${userNote}`;
    }

    const workoutDisplayName = state.type;
    const dateStr = new Date().toLocaleDateString('he-IL');
    
    const archiveObj = { 
        id: Date.now(), 
        date: dateStr, 
        timestamp: Date.now(), 
        type: workoutDisplayName, 
        duration: state.workoutDurationMins, 
        summary: text, 
        details: state.lastWorkoutDetails, 
        generalNote: userNote
    };

    StorageManager.saveToArchive(archiveObj);

    if (navigator.clipboard) { 
        navigator.clipboard.writeText(text).then(() => { 
            haptic('light'); 
            alert("הסיכום (כולל הערות) הועתק ונשמר בארכיון!"); 
            location.reload(); 
        }); 
    } else { 
        const el = document.createElement("textarea"); 
        el.value = text; 
        document.body.appendChild(el); 
        el.select(); 
        document.execCommand('copy'); 
        document.body.removeChild(el); 
        alert("הסיכום (כולל הערות) הועתק ונשמר בארכיון!"); 
        location.reload(); 
    }
}

// --- ARCHIVE LOGIC & CALENDAR ---

function switchArchiveView(view) {
    state.archiveView = view;
    document.getElementById('btn-view-list').className = `segment-btn ${view === 'list' ? 'active' : ''}`;
    document.getElementById('btn-view-calendar').className = `segment-btn ${view === 'calendar' ? 'active' : ''}`;
    openArchive();
}

function openArchive() {
    if (state.archiveView === 'list') {
        document.getElementById('list-view-container').style.display = 'block';
        document.getElementById('calendar-view').style.display = 'none';
        renderArchiveList();
    } else {
        document.getElementById('list-view-container').style.display = 'none';
        document.getElementById('calendar-view').style.display = 'block';
        state.calendarOffset = 0;
        renderCalendar();
    }
    navigate('ui-archive');
}

function renderArchiveList() {
    const list = document.getElementById('archive-list'); list.innerHTML = "";
    selectedArchiveIds.clear(); updateCopySelectedBtn();
    const history = StorageManager.getArchive();
    if (history.length === 0) { list.innerHTML = `<div style="text-align:center; color:gray; margin-top:20px;">אין אימונים שמורים</div>`; } 
    else {
        history.forEach(item => {
            const card = document.createElement('div'); card.className = "menu-card"; card.style.cursor = "default";
            card.innerHTML = `<div class="archive-card-row"><input type="checkbox" class="archive-checkbox" data-id="${item.timestamp}"><div class="archive-info"><div style="display:flex; justify-content:space-between; width:100%;"><h3 style="margin:0;">${item.date}</h3><span style="font-size:0.8em; color:#8E8E93">${item.duration} דק'</span></div><p style="margin:0; color:#8E8E93; font-size:0.85em;">${item.type}</p></div><div class="arrow">➔</div></div>`;
            const checkbox = card.querySelector('.archive-checkbox');
            checkbox.addEventListener('change', (e) => toggleArchiveSelection(parseInt(e.target.dataset.id)));
            checkbox.addEventListener('click', (e) => e.stopPropagation());
            card.addEventListener('click', (e) => { if (e.target !== checkbox) showArchiveDetail(item); });
            list.appendChild(card);
        });
    }
}

function toggleArchiveSelection(id) { if (selectedArchiveIds.has(id)) selectedArchiveIds.delete(id); else selectedArchiveIds.add(id); updateCopySelectedBtn(); }

function updateCopySelectedBtn() {
    const btn = document.getElementById('btn-copy-selected');
    if (selectedArchiveIds.size > 0) { btn.disabled = false; btn.style.opacity = "1"; btn.style.borderColor = "var(--accent)"; btn.style.color = "var(--accent)"; } 
    else { btn.disabled = true; btn.style.opacity = "0.5"; btn.style.borderColor = "var(--border)"; btn.style.color = "var(--text-dim)"; }
}

function copyBulkLog(mode) {
    const history = StorageManager.getArchive();
    let itemsToCopy = mode === 'all' ? history : history.filter(item => selectedArchiveIds.has(item.timestamp));
    if (itemsToCopy.length === 0) { alert("לא נבחרו אימונים להעתקה"); return; }
    const bulkText = itemsToCopy.map(item => item.summary).join("\n\n========================================\n\n");
    if (navigator.clipboard) { navigator.clipboard.writeText(bulkText).then(() => { haptic('success'); alert(`הועתקו ${itemsToCopy.length} אימונים בהצלחה!`); }); } 
    else { const el = document.createElement("textarea"); el.value = bulkText; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); alert(`הועתקו ${itemsToCopy.length} אימונים בהצלחה!`); }
}

function changeMonth(delta) {
    state.calendarOffset += delta;
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-days');
    grid.innerHTML = "";
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + state.calendarOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const monthNames = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
    document.getElementById('current-month-display').innerText = `${monthNames[month]} ${year}`;
    const firstDayIndex = targetDate.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const history = StorageManager.getArchive();
    const monthWorkouts = history.filter(item => {
        const d = new Date(item.timestamp);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    for(let i = 0; i < firstDayIndex; i++) {
        const cell = document.createElement('div'); cell.className = "calendar-cell empty"; grid.appendChild(cell);
    }

    const today = new Date();
    for(let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div'); cell.className = "calendar-cell";
        cell.innerHTML = `<span>${day}</span>`;
        if(state.calendarOffset === 0 && day === today.getDate()) cell.classList.add('today');

        const dailyWorkouts = monthWorkouts.filter(item => new Date(item.timestamp).getDate() === day);
        if(dailyWorkouts.length > 0) {
            const dotsContainer = document.createElement('div'); dotsContainer.className = "dots-container";
            dailyWorkouts.forEach(wo => {
                const dot = document.createElement('div');
                let dotClass = 'type-free';
                if(wo.type.includes('A')) dotClass = 'type-a';
                else if(wo.type.includes('B')) dotClass = 'type-b';
                else if(wo.type.includes('C')) dotClass = 'type-c';
                dot.className = `dot ${dotClass}`;
                dotsContainer.appendChild(dot);
            });
            cell.appendChild(dotsContainer);
            cell.onclick = () => openDayDrawer(dailyWorkouts, day, monthNames[month]);
        }
        grid.appendChild(cell);
    }
}

function openDayDrawer(workouts, day, monthName) {
    const drawer = document.getElementById('sheet-modal');
    const overlay = document.getElementById('sheet-overlay');
    const content = document.getElementById('sheet-content');
    let html = `<h3>${day} ב${monthName}</h3>`;
    if(workouts.length === 0) { html += `<p>אין אימונים ביום זה</p>`; } 
    else {
        html += `<p>נמצאו ${workouts.length} אימונים:</p>`;
        workouts.forEach(wo => {
            let dotColor = '#BF5AF2';
            if(wo.type.includes('A')) dotColor = '#0A84FF';
            else if(wo.type.includes('B')) dotColor = '#32D74B';
            else if(wo.type.includes('C')) dotColor = '#FF9F0A';
            html += `
            <div class="mini-workout-item" onclick='openArchiveFromDrawer(${JSON.stringify(wo).replace(/'/g, "&#39;")})'>
                <div class="mini-dot" style="background:${dotColor}"></div>
                <div style="flex-grow:1;">
                    <div style="font-weight:600; font-size:0.95em;">${wo.type}</div>
                    <div style="font-size:0.8em; color:#8E8E93;">${wo.duration} דק' • ${new Date(wo.timestamp).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
                <div class="arrow">➔</div>
            </div>`;
        });
    }
    content.innerHTML = html;
    overlay.style.display = 'block';
    drawer.classList.add('open');
    haptic('light');
}

function closeDayDrawer() {
    const drawer = document.getElementById('sheet-modal');
    const overlay = document.getElementById('sheet-overlay');
    drawer.classList.remove('open');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

function openArchiveFromDrawer(itemData) {
    closeDayDrawer();
    const realItem = StorageManager.getArchive().find(i => i.timestamp === itemData.timestamp);
    if(realItem) showArchiveDetail(realItem);
}

function showArchiveDetail(item) {
    currentArchiveItem = item; document.getElementById('archive-detail-content').innerText = item.summary;
    document.getElementById('btn-archive-copy').onclick = () => navigator.clipboard.writeText(item.summary).then(() => alert("הועתק!"));
    document.getElementById('btn-archive-delete').onclick = () => { if(confirm("למחוק אימון זה מהארכיון?")) { StorageManager.deleteFromArchive(item.timestamp); openArchive(); } };
    navigate('ui-archive-detail');
}

function exportData() {
    const data = StorageManager.getAllData();
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: "application/json"})); a.download = `gympro_backup_${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function triggerImport() { document.getElementById('import-file').click(); }
function importData(input) {
    const file = input.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if(confirm("האם לדרוס את הנתונים הקיימים ולשחזר מהגיבוי?")) { StorageManager.restoreData(data); alert("הנתונים שוחזרו בהצלחה! האפליקציה תרענן את עצמה."); location.reload(); }
        } catch(err) { alert("שגיאה בטעינת הקובץ. וודא שזהו קובץ גיבוי תקין."); }
    };
    reader.readAsText(file);
}

function openSessionLog() {
    const drawer = document.getElementById('sheet-modal');
    const overlay = document.getElementById('sheet-overlay');
    const content = document.getElementById('sheet-content');

    let html = `<h3>יומן אימון נוכחי</h3>`;
    
    if (state.log.length === 0) {
        html += `<p style="text-align:center; margin-top:20px;">טרם בוצעו סטים באימון זה</p>`;
    } else {
        html += `<div class="vertical-stack">`;
        state.log.forEach((entry, index) => {
            const isSkip = entry.skip;
            const isWarmup = entry.isWarmup;
            let displayTitle = entry.exName;
            let details = "";
            let dotColor = "var(--text-dim)";

            if (isSkip) {
                details = "דילוג על תרגיל";
            } else if (isWarmup) {
                details = "סט חימום";
                dotColor = "#ff3b30";
            } else {
                details = `${entry.w}kg x ${entry.r} (RIR ${entry.rir})`;
                if (entry.note) details += ` | 📝`;
                dotColor = "var(--accent)";
            }

            html += `
            <div class="mini-workout-item" onclick="openEditSet(${index})">
                <div class="mini-dot" style="background:${dotColor}"></div>
                <div style="flex-grow:1;">
                    <div style="font-weight:600; font-size:0.9em;">${index + 1}. ${displayTitle}</div>
                    <div style="font-size:0.85em; color:#8E8E93;">${details}</div>
                </div>
                <div class="arrow">✎</div>
            </div>`;
        });
        html += `</div>`;
    }

    content.innerHTML = html;
    overlay.style.display = 'block';
    drawer.classList.add('open');
    haptic('light');
}

function openEditSet(index) {
    const entry = state.log[index];
    if (entry.skip || entry.isWarmup) {
        alert("לא ניתן לערוך דילוגים או סטים של חימום כרגע.");
        return;
    }

    state.editingIndex = index;
    document.getElementById('edit-weight').value = entry.w;
    document.getElementById('edit-reps').value = entry.r;
    document.getElementById('edit-rir').value = entry.rir;
    document.getElementById('edit-note').value = entry.note || "";

    const btnDelete = document.getElementById('btn-delete-last-set');
    if (index === state.log.length - 1) {
        btnDelete.style.display = 'block';
    } else {
        btnDelete.style.display = 'none';
    }

    closeDayDrawer(); 
    document.getElementById('edit-set-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-set-modal').style.display = 'none';
    state.editingIndex = -1;
}

function saveSetEdit() {
    if (state.editingIndex === -1) return;
    
    const w = parseFloat(document.getElementById('edit-weight').value);
    const r = parseInt(document.getElementById('edit-reps').value);
    const rir = document.getElementById('edit-rir').value;
    const note = document.getElementById('edit-note').value;

    if (isNaN(w) || isNaN(r)) {
        alert("נא להזין ערכים תקינים");
        return;
    }

    state.log[state.editingIndex].w = w;
    state.log[state.editingIndex].r = r;
    state.log[state.editingIndex].rir = rir;
    state.log[state.editingIndex].note = note;

    if (state.editingIndex === state.log.length - 1) {
        state.lastLoggedSet = state.log[state.editingIndex];
        const hist = document.getElementById('last-set-info');
        hist.innerText = `סט אחרון: ${state.lastLoggedSet.w}kg x ${state.lastLoggedSet.r} (RIR ${state.lastLoggedSet.rir})`;
    }

    closeEditModal();
    haptic('success');
    openSessionLog(); 
}

function deleteLastSet() {
    if (confirm("האם למחוק את הסט האחרון? פעולה זו תחזיר אותך צעד אחד אחורה.")) {
        state.log.pop();
        state.lastLoggedSet = state.log.length > 0 ? state.log[state.log.length - 1] : null;
        
        if (document.getElementById('action-panel').style.display === 'block') {
             document.getElementById('action-panel').style.display = 'none';
             document.getElementById('btn-submit-set').style.display = 'block';
        } else if (state.setIdx > 0) {
            state.setIdx--;
        }
        
        closeEditModal();
        haptic('warning');
        initPickers(); 
    }
}
