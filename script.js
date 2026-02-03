/**
 * GYMPRO ELITE V12.11.0 (Smart Exit & Live History)
 * - Logic: Smart Back Navigation (State Reconstruction).
 * - Feature: Live History Drawer in active workout.
 * - UX: Text-based History button.
 */

// --- DEFAULT DATA (No Changes) ---
const defaultExercises = [
    // ... (אותה רשימה כמו קודם - ללא שינוי)
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
    { name: "Y Raises", muscles: ["גב", "כתפיים"], sets: [{w: 4, r: 12}, {w: 4, r: 12}, {w: 4, r: 12}], step: 1 },
    { name: "L Raises", muscles: ["גב", "כתפיים"], sets: [{w: 3, r: 12}, {w: 3, r: 12}, {w: 3, r: 12}], step: 1 },
    { name: "Weighted Pull Ups", muscles: ["גב", "קליסטניקס"], sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}], step: 5, minW: 0, maxW: 60, isBW: true },
    { name: "Pull Ups", muscles: ["גב", "קליסטניקס"], isBW: true, sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}], step: 5, minW: 0, maxW: 60 },
    { name: "Chin Ups", muscles: ["גב", "קליסטניקס"], isBW: true, sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}], step: 5, minW: 0, maxW: 60 },
    { name: "Wide Grip Pull Ups", muscles: ["גב", "קליסטניקס"], isBW: true, sets: [{w: 0, r: 8}, {w: 0, r: 8}, {w: 0, r: 8}], step: 5, minW: 0, maxW: 60 },
    { name: "Lat Pulldown", muscles: ["גב"], sets: [{w: 75, r: 10}, {w: 75, r: 10}, {w: 75, r: 11}], step: 2.5 },
    { name: "Cable Row", muscles: ["גב"], sets: [{w: 65, r: 10}, {w: 65, r: 10}, {w: 65, r: 12}], step: 2.5 },
    { name: "Machine Row", muscles: ["גב"], sets: [{w: 50, r: 10}, {w: 50, r: 10}, {w: 50, r: 12}], step: 5 },
    { name: "Straight Arm Pulldown", muscles: ["גב"], sets: [{w: 30, r: 10}, {w: 30, r: 12}, {w: 30, r: 12}], step: 2.5 },
    { name: "Back Extension", muscles: ["גב"], sets: [{w: 0, r: 12}, {w: 0, r: 12}, {w: 0, r: 12}], step: 5, minW: 0, maxW: 50, isBW: true },
    { name: "T-Bar Row", muscles: ["גב"], sets: [{w: 40, r: 10}, {w: 40, r: 10}, {w: 40, r: 10}], step: 5 },
    { name: "Single Arm Dumbbell Row", muscles: ["גב"], sets: [{w: 25, r: 10}, {w: 25, r: 10}, {w: 25, r: 10}], step: 2.5 },
    { name: "Rack Pulls", muscles: ["גב"], sets: [{w: 100, r: 5}, {w: 100, r: 5}, {w: 100, r: 5}], step: 5 },
    { name: "Reverse Fly (Machine)", muscles: ["גב", "כתפיים"], sets: [{w: 30, r: 12}, {w: 30, r: 12}, {w: 30, r: 12}], step: 2.5 },
    { name: "Bodyweight Rows", muscles: ["גב", "קליסטניקס"], isBW: true, sets: [{w: 0, r: 10}, {w: 0, r: 10}, {w: 0, r: 10}] },
    { name: "Bench Press (Main)", muscles: ["חזה"], isCalc: true, baseRM: 100, rmRange: [80, 150], manualRange: {base: 85, min: 60, max: 140, step: 2.5} },
    { name: "Incline Bench Press", muscles: ["חזה"], sets: [{w: 65, r: 9}, {w: 65, r: 9}, {w: 65, r: 9}], step: 2.5 },
    { name: "Dumbbell Peck Fly", muscles: ["חזה"], sets: [{w: 14, r: 11}, {w: 14, r: 11}, {w: 14, r: 11}], step: 2 },
    { name: "Machine Peck Fly", muscles: ["חזה"], sets: [{w: 45, r: 11}, {w: 45, r: 11}, {w: 45, r: 11}], step: 1 },
    { name: "Cable Fly", muscles: ["חזה"], sets: [{w: 12.5, r: 11}, {w: 12.5, r: 11}, {w: 12.5, r: 11}], step: 2.5 },
    { name: "Dips", muscles: ["חזה", "קליסטניקס"], isBW: true, sets: [{w: 0, r: 10}, {w: 0, r: 10}, {w: 0, r: 10}] },
    { name: "Decline Bench Press", muscles: ["חזה"], sets: [{w: 80, r: 8}, {w: 80, r: 8}, {w: 80, r: 8}], step: 2.5 },
    { name: "Dumbbell Bench Press", muscles: ["חזה"], sets: [{w: 30, r: 8}, {w: 30, r: 8}, {w: 30, r: 8}], step: 2.5 },
    { name: "Incline Dumbbell Bench Press", muscles: ["חזה"], sets: [{w: 25, r: 8}, {w: 25, r: 8}, {w: 25, r: 8}], step: 2.5 },
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
    { name: "Dumbbell Bicep Curls", muscles: ["ידיים", "biceps"], sets: [{w: 12, r: 8}, {w: 12, r: 8}, {w: 12, r: 8}], step: 0.5 },
    { name: "Barbell Bicep Curls", muscles: ["ידיים", "biceps"], sets: [{w: 25, r: 8}, {w: 25, r: 8}, {w: 25, r: 8}], step: 1 },
    { name: "Concentration Curls", muscles: ["ידיים", "biceps"], sets: [{w: 10, r: 10}, {w: 10, r: 10}, {w: 10, r: 10}], step: 0.5 },
    { name: "Hammer Curls", muscles: ["ידיים", "biceps"], sets: [{w: 12, r: 10}, {w: 12, r: 10}, {w: 12, r: 10}], step: 1 },
    { name: "Preacher Curls", muscles: ["ידיים", "biceps"], sets: [{w: 20, r: 10}, {w: 20, r: 10}, {w: 20, r: 10}], step: 1 },
    { name: "Reverse Grip Curl", muscles: ["ידיים", "biceps"], sets: [{w: 15, r: 10}, {w: 15, r: 10}, {w: 15, r: 10}], step: 1 },
    { name: "Triceps Pushdown", muscles: ["ידיים", "triceps"], sets: [{w: 35, r: 8}, {w: 35, r: 8}, {w: 35, r: 8}], step: 2.5 },
    { name: "Skullcrushers", muscles: ["ידיים", "triceps"], sets: [{w: 25, r: 8}, {w: 25, r: 8}, {w: 25, r: 8}], step: 2.5 },
    { name: "Overhead Triceps Extension (Cable)", muscles: ["ידיים", "triceps"], sets: [{w: 15, r: 12}, {w: 15, r: 12}, {w: 15, r: 12}], step: 1.25 },
    { name: "Muscle Up", muscles: ["קליסטניקס"], isBW: true, sets: [{w: 0, r: 3}, {w: 0, r: 3}, {w: 0, r: 3}] },
    { name: "Pistol Squat", muscles: ["קליסטניקס", "רגליים", "quads"], isBW: true, sets: [{w: 0, r: 5}, {w: 0, r: 5}, {w: 0, r: 5}] },
    { name: "Handstand Pushups", muscles: ["קליסטניקס", "כתפיים"], isBW: true, sets: [{w: 0, r: 5}, {w: 0, r: 5}, {w: 0, r: 5}] },
    { name: "Front Lever", muscles: ["קליסטניקס", "גב"], isBW: true, sets: [{w: 0, r: 5}, {w: 0, r: 5}, {w: 0, r: 5}] },
    { name: "Diamond Pushups", muscles: ["קליסטניקס", "חזה", "ידיים", "triceps"], isBW: true, sets: [{w: 0, r: 12}, {w: 0, r: 12}, {w: 0, r: 12}] },
    { name: "L-Sit", muscles: ["קליסטניקס", "בטן"], isBW: true, sets: [{w: 0, r: 10}, {w: 0, r: 10}, {w: 0, r: 10}] }
];

const defaultWorkouts = {
    'כתפיים - גב - חזה': [
        { name: "Overhead Press (Main)", isMain: true, sets: 0 },
        { name: "Barbell Shrugs", isMain: false, sets: 3 },
        { name: "Lateral Raises", isMain: false, sets: 3 },
        { name: "Weighted Pull Ups", isMain: false, sets: 3 },
        { name: "Face Pulls", isMain: false, sets: 3 },
        { name: "Incline Bench Press", isMain: false, sets: 3 }
    ],
    'רגליים - גב': [
        { name: "Leg Press", isMain: false, sets: 3 },
        { name: "Single Leg Curl", isMain: false, sets: 3 },
        { name: "Lat Pulldown", isMain: false, sets: 3 },
        { name: "Cable Row", isMain: false, sets: 3 },
        { name: "Seated Calf Raise", isMain: false, sets: 3 },
        { name: "Straight Arm Pulldown", isMain: false, sets: 3 }
    ],
    'חזה - כתפיים': [
        { name: "Bench Press (Main)", isMain: true, sets: 0 },
        { name: "Incline Bench Press", isMain: false, sets: 3 },
        { name: "Dumbbell Peck Fly", isMain: false, sets: 3 },
        { name: "Lateral Raises", isMain: false, sets: 3 },
        { name: "Face Pulls", isMain: false, sets: 3 }
    ]
};

// --- SUBSTITUTION LOGIC (No Changes) ---
const substituteGroups = [
    ["Incline Bench Press", "Incline Dumbbell Bench Press"],
    ["Dumbbell Bench Press", "Machine Press"], 
    ["Dumbbell Peck Fly", "Machine Peck Fly", "Cable Fly"],
    ["Weighted Pull Ups", "Pull Ups", "Chin Ups", "Wide Grip Pull Ups", "Lat Pulldown"],
    ["Cable Row", "Machine Row", "T-Bar Row", "Single Arm Dumbbell Row", "Bodyweight Rows"],
    ["Straight Arm Pulldown", "Weighted Pull Ups"], 
    ["Dumbbell Shoulder Press", "Arnold Press", "Machine Press"],
    ["Lateral Raises", "Cable Lateral Raises"],
    ["Face Pulls", "Rear Delt Fly (Dumbbells)", "Reverse Fly (Machine)"],
    ["Single Leg Curl", "Lying Leg Curl (Double)", "Seated Leg Curl"],
    ["Seated Calf Raise", "Standing Calf Raise"],
    ["Leg Press", "Hack Squat", "Bulgarian Split Squat", "Walking Lunges"],
    ["Dumbbell Bicep Curls", "Barbell Bicep Curls", "Concentration Curls", "Hammer Curls", "Preacher Curls", "Reverse Grip Curl"],
    ["Triceps Pushdown", "Skullcrushers", "Overhead Triceps Extension (Cable)", "Diamond Pushups"]
];

function getSubstitutes(exName) {
    const group = substituteGroups.find(g => g.includes(exName));
    return group ? group.filter(n => n !== exName) : [];
}

function isExOrVariationDone(originalName) {
    if (state.completedExInSession.includes(originalName)) return true;
    const group = substituteGroups.find(g => g.includes(originalName));
    if (group) {
        return group.some(varName => state.completedExInSession.includes(varName));
    }
    return false;
}

// --- GLOBAL STATE ---
let state = {
    week: 1, type: '', rm: 100, exIdx: 0, setIdx: 0, 
    log: [], currentEx: null, currentExName: '',
    historyStack: ['ui-week'],
    timerInterval: null, seconds: 0, startTime: null,
    isFreestyle: false, isExtraPhase: false, isInterruption: false, 
    currentMuscle: '',
    completedExInSession: [],
    workoutStartTime: null, workoutDurationMins: 0,
    lastLoggedSet: null,
    lastWorkoutDetails: {},
    archiveView: 'list',
    calendarOffset: 0,
    editingIndex: -1,
    freestyleFilter: 'all',
    exercises: [],
    workouts: {},
    workoutMeta: {}, 
    
    // Cluster State
    clusterMode: false,
    activeCluster: null,
    clusterIdx: 0, 
    clusterRound: 1,
    lastClusterRest: 0
};

let managerState = {
    originalName: '',
    currentName: '',
    exercises: [],
    selectorFilter: 'all',
    activeClusterRef: null,
    editingTimerEx: null 
};

const unilateralKeywords = [
    "Dumbbell", "Cable Lateral", "Single", "Concentration", "Hammer", "Pistol", "Walking Lunges", "Bulgarian", "Kickback", "One Arm", "Arnold", "Raises"
];

let audioContext;
let wakeLock = null;
let currentArchiveItem = null;
let selectedArchiveIds = new Set(); 

// --- LOCAL STORAGE MANAGER (No Changes) ---
const StorageManager = {
    KEY_WEIGHTS: 'gympro_weights',
    KEY_RM: 'gympro_rm',
    KEY_ARCHIVE: 'gympro_archive',
    KEY_DB_EXERCISES: 'gympro_db_exercises',
    KEY_DB_WORKOUTS: 'gympro_db_workouts',
    KEY_META: 'gympro_workout_meta',
    KEY_SESSION: 'gympro_current_session', 

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
        const storedMeta = this.getData(this.KEY_META);

        if (storedEx && storedEx.length > 0) {
            state.exercises = storedEx;
            const missing = defaultExercises.filter(def => !state.exercises.find(e => e.name === def.name));
            if (missing.length > 0) {
                state.exercises = [...state.exercises, ...missing];
                this.saveData(this.KEY_DB_EXERCISES, state.exercises);
            }
        } else {
            state.exercises = JSON.parse(JSON.stringify(defaultExercises));
            this.saveData(this.KEY_DB_EXERCISES, state.exercises);
        }

        if (storedWo && Object.keys(storedWo).length > 0) {
            state.workouts = storedWo;
        } else {
            state.workouts = JSON.parse(JSON.stringify(defaultWorkouts));
            this.saveData(this.KEY_DB_WORKOUTS, state.workouts);
        }

        if (storedMeta) {
            state.workoutMeta = storedMeta;
        } else {
            state.workoutMeta = {};
            this.saveData(this.KEY_META, state.workoutMeta);
        }
    },

    saveSessionState() {
        const sessionData = {
            state: JSON.parse(JSON.stringify(state)),
            managerState: JSON.parse(JSON.stringify(managerState)),
            timestamp: Date.now()
        };
        sessionData.state.timerInterval = null; 
        this.saveData(this.KEY_SESSION, sessionData);
    },

    clearSessionState() {
        localStorage.removeItem(this.KEY_SESSION);
    },

    hasActiveSession() {
        return !!localStorage.getItem(this.KEY_SESSION);
    },

    getSessionState() {
        return this.getData(this.KEY_SESSION);
    },

    resetFactory() {
        if(confirm("פעולה זו תאפס את כל התרגילים והאימונים לברירת המחדל. האם להמשיך?")) {
            localStorage.removeItem(this.KEY_DB_EXERCISES);
            localStorage.removeItem(this.KEY_DB_WORKOUTS);
            localStorage.removeItem(this.KEY_META);
            localStorage.removeItem(this.KEY_SESSION);
            location.reload();
        }
    },

    getLastWeight(exName) {
        const data = this.getData(this.KEY_WEIGHTS) || {};
        return data[exName] || null;
    },

    saveWeight(exName, weight) {
        if (state.week === 'deload') return;
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
    },

    exportConfiguration() {
        const configData = {
            type: 'config_only',
            version: '12.11.0',
            date: new Date().toISOString(),
            workouts: this.getData(this.KEY_DB_WORKOUTS),
            exercises: this.getData(this.KEY_DB_EXERCISES),
            meta: this.getData(this.KEY_META)
        };
        const a = document.createElement('a'); 
        a.href = URL.createObjectURL(new Blob([JSON.stringify(configData, null, 2)], {type: "application/json"})); 
        a.download = `gympro_config_${new Date().toISOString().slice(0,10)}.json`; 
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    },

    importConfiguration(data) {
        if (data.type !== 'config_only') {
            alert("שגיאה: קובץ תבנית לא תקין.");
            return;
        }
        if(confirm("פעולה זו תדרוס את התוכניות והתרגילים. האם להמשיך?")) {
            this.saveData(this.KEY_DB_WORKOUTS, data.workouts);
            this.saveData(this.KEY_DB_EXERCISES, data.exercises);
            if (data.meta) this.saveData(this.KEY_META, data.meta);
            alert("התבניות נטענו בהצלחה!");
            location.reload();
        }
    }
};

// --- INITIALIZATION ---
window.onload = () => {
    StorageManager.initDB();
    renderWorkoutMenu();
    checkRecovery();
};

function checkRecovery() {
    if (StorageManager.hasActiveSession()) {
        document.getElementById('recovery-modal').style.display = 'flex';
    }
}

function restoreSession() {
    const session = StorageManager.getSessionState();
    if (session && session.state) {
        state = session.state;
        if (session.managerState) managerState = session.managerState;
        
        document.getElementById('recovery-modal').style.display = 'none';
        
        // Handle migration logic (12.10)
        let lastScreen = state.historyStack[state.historyStack.length - 1];
        if (['ui-muscle-select', 'ui-ask-arms', 'ui-arm-selection'].includes(lastScreen)) {
             if (lastScreen === 'ui-muscle-select') {
                 state.historyStack.pop();
                 state.historyStack.push('ui-variation');
                 lastScreen = 'ui-variation';
             } else {
                 state.historyStack.pop();
                 state.historyStack.push('ui-ask-extra');
                 lastScreen = 'ui-ask-extra';
             }
        }
        
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(lastScreen).classList.add('active');
        document.getElementById('global-back').style.visibility = (lastScreen === 'ui-week') ? 'hidden' : 'visible';
        
        switch (lastScreen) {
            case 'ui-main':
                initPickers();
                // Ensure Action Panel is visible if we were done
                if (document.getElementById('btn-submit-set').style.display === 'none') {
                    document.getElementById('action-panel').style.display = 'block';
                    document.getElementById('next-ex-preview').innerText = `הבא בתור: ${getNextExerciseName()}`;
                }

                if (state.startTime && state.seconds > 0) {
                    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
                    let target = state.currentEx && state.currentEx.restTime ? state.currentEx.restTime : 90;
                    if (elapsed < target) {
                        document.getElementById('timer-area').style.visibility = 'visible';
                        resetAndStartTimer(target); 
                    } else {
                         document.getElementById('timer-area').style.visibility = 'visible';
                         document.getElementById('rest-timer').innerText = "00:00";
                         document.getElementById('timer-progress').style.strokeDashoffset = 0;
                         state.seconds = target;
                    }
                }
                break;
            case 'ui-cluster-rest': renderClusterRestUI(); break;
            case 'ui-confirm': showConfirmScreen(state.currentExName); break;
            case 'ui-swap-list': openSwapMenu(); break;
            case 'ui-workout-manager': renderManagerList(); break;
            case 'ui-workout-editor': renderEditorList(); document.getElementById('editor-workout-name').value = managerState.currentName; break;
            case 'ui-exercise-selector': document.getElementById('selector-search').value = ""; updateSelectorChips(); renderSelectorList(); break;
            case 'ui-1rm': setupCalculatedEx(); break;
            case 'ui-variation': 
                updateVariationUI();
                renderFreestyleChips();
                renderFreestyleList();
                break;
            case 'ui-exercise-db': renderExerciseDatabase(); break;
            case 'ui-archive': openArchive(); break;
        }
        haptic('success');
    } else {
        discardSession();
    }
}

function discardSession() {
    StorageManager.clearSessionState();
    document.getElementById('recovery-modal').style.display = 'none';
}

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
    btn.innerHTML = `<div class="card-text center-text">מנוע סאונד פעיל</div>`;
    btn.style.background = "var(--success-gradient)";
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {}
}

function navigate(id) {
    haptic('light');
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    if (id !== 'ui-main') stopRestTimer();
    
    // Only push to stack if we are not manually manipulating history (handled in handleBackClick)
    if (state.historyStack[state.historyStack.length - 1] !== id) state.historyStack.push(id);
    
    document.getElementById('global-back').style.visibility = (id === 'ui-week') ? 'hidden' : 'visible';
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) settingsBtn.style.visibility = (id === 'ui-week') ? 'visible' : 'hidden';
}

/**
 * REWRITTEN handleBackClick (V12.11.0 SMART EXIT)
 * Implements State Reconstruction for workout flow.
 */
function handleBackClick() {
    haptic('warning');
    if (state.historyStack.length <= 1) return;

    const currentScreen = state.historyStack[state.historyStack.length - 1];

    // --- SMART LOGIC FOR WORKOUT FLOW ---
    
    // 1. ACTIVE EXERCISE SCREEN (ui-main)
    if (currentScreen === 'ui-main') {
        const actionPanel = document.getElementById('action-panel');
        
        // Scenario A: Action Panel is visible (Exercise finished view)
        // Action: Un-finish. Return to editing the last set.
        if (actionPanel.style.display !== 'none') {
            actionPanel.style.display = 'none';
            document.getElementById('btn-submit-set').style.display = 'block';
            document.getElementById('btn-skip-exercise').style.display = (state.setIdx === 0) ? 'none' : 'block';
            initPickers(); // Reloads current set values
            return; // Stay on ui-main
        }

        // Scenario B: Mid-set (Set > 0)
        // Action: Confirm delete last set
        if (state.setIdx > 0) {
            if(confirm("למחוק את הסט האחרון ולחזור אליו?")) {
                // Remove last log entry
                state.log.pop();
                
                // Update lastLoggedSet pointer
                const relevantLogs = state.log.filter(l => l.exName === state.currentExName && !l.skip && !l.isWarmup);
                if (relevantLogs.length > 0) state.lastLoggedSet = relevantLogs[relevantLogs.length - 1];
                else state.lastLoggedSet = null;

                state.setIdx--;
                initPickers(); // UI refresh
                StorageManager.saveSessionState();
                return; // Stay on ui-main
            }
            return; // Abort back
        }

        // Scenario C: First set (Set 0)
        // Action: Return to ui-confirm (Cancel exercise entry)
        stopRestTimer();
        state.historyStack.pop(); 
        navigate('ui-confirm');
        return;
    }

    // 2. CONFIRM NEXT EXERCISE SCREEN (ui-confirm)
    if (currentScreen === 'ui-confirm') {
        // If it's the very first exercise and no logs, just exit
        if (state.exIdx === 0 && state.log.length === 0) {
            if(confirm("האם לצאת מהאימון?")) StorageManager.clearSessionState();
            else return;
        } 
        else {
            // We are mid-workout. "Back" means "Go to previous exercise finished state"
            stepBackToPreviousExercise();
            return;
        }
    }

    // 3. FREESTYLE/VARIATION SCREEN (ui-variation)
    if (currentScreen === 'ui-variation') {
        // Cleanup flags
        state.isInterruption = false;
        state.isExtraPhase = false;
        state.freestyleFilter = 'all';

        // If we came here from "Add Exercise" (Interruption), go back to where we were
        // If we are in extra phase, go back to finished state of previous extra
        state.historyStack.pop();
        const prev = state.historyStack[state.historyStack.length - 1];
        
        // Manual navigate to avoid double stack push
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(prev).classList.add('active');
        
        // Refresh UI if needed
        if (prev === 'ui-main') {
            // Should be in action panel state
            document.getElementById('action-panel').style.display = 'block';
            document.getElementById('btn-submit-set').style.display = 'none';
        }
        return;
    }

    // --- STANDARD NAVIGATION (Setup/Menu Screens) ---
    
    if (currentScreen === 'ui-cluster-rest') {
        if(!confirm("האם לצאת ממצב Cluster?")) return;
        state.clusterMode = false;
    }

    if (currentScreen === 'ui-workout-editor') { 
        if(confirm("לצאת ללא שמירה?")) { 
            state.historyStack.pop(); 
            navigate('ui-workout-manager'); 
            return;
        }
        return; 
    }

    if (currentScreen === 'ui-exercise-selector') {
        document.getElementById('selector-search').value = "";
    }

    state.historyStack.pop();
    const prevScreen = state.historyStack[state.historyStack.length - 1];
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(prevScreen).classList.add('active');
    
    document.getElementById('global-back').style.visibility = (prevScreen === 'ui-week') ? 'hidden' : 'visible';
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) settingsBtn.style.visibility = (prevScreen === 'ui-week') ? 'visible' : 'hidden';
}

/**
 * NEW FUNCTION: Time Travel Logic
 * Reconstructs the state of the previous exercise to allow editing.
 */
function stepBackToPreviousExercise() {
    // 1. Find the last executed exercise from the log
    // We ignore warmups for "exercise type" determination, but we need the name
    const validLogs = state.log.filter(l => !l.isWarmup);
    if (validLogs.length === 0) {
        // Fallback: Just exit if no history
        if(confirm("האם לצאת מהאימון?")) StorageManager.clearSessionState();
        return;
    }

    const lastEntry = validLogs[validLogs.length - 1];
    const prevExName = lastEntry.exName;

    // 2. Load Exercise Data
    const exData = state.exercises.find(e => e.name === prevExName);
    if (!exData) { alert("Error: Exercise data not found"); return; }
    
    state.currentEx = JSON.parse(JSON.stringify(exData));
    state.currentExName = prevExName;

    // 3. Determine if it was part of the plan or freestyle
    // If the name matches the *previous* plan item, decrement index.
    // If we are currently at index X, we check index X-1.
    const plan = state.workouts[state.type];
    if (plan && state.exIdx > 0) {
        const prevPlanItem = plan[state.exIdx - 1];
        if (prevPlanItem && prevPlanItem.name === prevExName) {
            state.exIdx--; // Revert plan pointer
        }
        // If it doesn't match, it was a Freestyle interruption. 
        // We do NOT change exIdx, so we stay "before" the current plan item.
    }

    // 4. Reconstruct Set Index
    // Count how many sets of this exercise are in the log (excluding warmups)
    const setLogCount = state.log.filter(l => l.exName === prevExName && !l.isWarmup).length;
    state.setIdx = setLogCount; // Position at "Done" (index = count)
    
    // Set last logged set for display
    const relevantLogs = state.log.filter(l => l.exName === prevExName && !l.skip && !l.isWarmup);
    state.lastLoggedSet = relevantLogs.length > 0 ? relevantLogs[relevantLogs.length - 1] : null;

    // 5. Navigate to UI Main in "Finished" state
    state.historyStack.push('ui-main'); // Manually push since we bypass navigate() logic sometimes
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('ui-main').classList.add('active');
    
    initPickers(); // Load values
    
    // Force Action Panel View
    document.getElementById('btn-submit-set').style.display = 'none';
    document.getElementById('btn-skip-exercise').style.display = 'none';
    document.getElementById('action-panel').style.display = 'block';
    
    // Update "Next Exercise" preview in the panel
    document.getElementById('next-ex-preview').innerText = `הבא בתור: ${getNextExerciseName()}`;
    
    StorageManager.saveSessionState();
}

/**
 * NEW FUNCTION: Live History Drawer
 * Shows history for the *current* exercise without leaving the screen.
 */
function openLiveHistory() {
    const history = getLastPerformance(state.currentExName);
    
    const drawer = document.getElementById('sheet-modal');
    const overlay = document.getElementById('sheet-overlay');
    const content = document.getElementById('sheet-content');

    let html = `<h3>היסטוריית ביצוע</h3><p class="sub-text">${state.currentExName}</p>`;

    if (history) {
        let rowsHtml = "";
        history.sets.forEach((setStr, idx) => {
            let weight = "-", reps = "-", rir = "-";
            try {
                const parts = setStr.split('x');
                if(parts.length > 1) {
                    weight = parts[0].replace('kg', '').trim();
                    const rest = parts[1];
                    const rirMatch = rest.match(/\(RIR (.*?)\)/);
                    reps = rest.split('(')[0].trim();
                    if(rirMatch) rir = rirMatch[1];
                }
            } catch(e) {}

            rowsHtml += `
            <div class="history-row" style="grid-template-columns: 0.5fr 1fr 1fr 1fr;">
                <div class="history-col set-idx">#${idx + 1}</div>
                <div class="history-col">${weight}</div>
                <div class="history-col">${reps}</div>
                <div class="history-col rir-note">${rir}</div>
            </div>`;
        });

        html += `
        <div class="history-card-container" style="border:none; padding:0; background:transparent;">
            <div style="font-size:0.85em; color:var(--text-dim); text-align:right; margin-bottom:10px;">📅 ביצוע אחרון: ${history.date}</div>
            <div class="history-header" style="grid-template-columns: 0.5fr 1fr 1fr 1fr;">
                <div>סט</div>
                <div>משקל</div>
                <div>חזרות</div>
                <div>RIR</div>
            </div>
            <div class="history-list">${rowsHtml}</div>
        </div>
        `;
    } else {
        html += `<p style="text-align:center; padding: 20px;">אין נתונים קודמים לתרגיל זה.</p>`;
    }

    html += `<button class="btn-text" onclick="closeDayDrawer()" style="margin-top:20px;">סגור</button>`;

    content.innerHTML = html;
    overlay.style.display = 'block';
    drawer.classList.add('open');
    haptic('light');
}

function openSettings() { navigate('ui-settings'); }
function resetToFactorySettings() { StorageManager.resetFactory(); }

// --- DYNAMIC MAIN MENU & DELOAD LOGIC ---
function renderWorkoutMenu() {
    const container = document.getElementById('workout-menu-container');
    container.innerHTML = "";
    const title = document.getElementById('workout-week-title');
    
    if (state.week === 'deload') {
        title.innerText = "שבוע דילואוד";
        const keys = Object.keys(state.workouts);
        const deloadWorkouts = keys.filter(k => {
             const meta = state.workoutMeta[k];
             return meta && meta.availableInDeload === true;
        });

        if(deloadWorkouts.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:var(--text-dim);">בחר Freestyle או סמן תוכנית כדילואוד בעורך</p>`;
        } else {
             deloadWorkouts.forEach(key => {
                const btn = document.createElement('button');
                btn.className = "menu-card tall";
                btn.innerHTML = `<h3>${key}</h3>`;
                btn.onclick = () => selectWorkout(key);
                container.appendChild(btn);
             });
        }
    } else {
        title.innerText = `שבוע ${state.week} - בחר אימון`;
        Object.keys(state.workouts).forEach(key => {
            const btn = document.createElement('button');
            btn.className = "menu-card tall";
            let count = 0;
            const w = state.workouts[key];
            if(Array.isArray(w)) {
                w.forEach(item => { if(item.type === 'cluster') count += item.exercises.length; else count++; });
            }
            btn.innerHTML = `<h3>${key}</h3><p>${count} תרגילים</p>`;
            btn.onclick = () => selectWorkout(key);
            container.appendChild(btn);
        });
    }
}
// --- WORKOUT MANAGER ---

function openWorkoutManager() { renderManagerList(); navigate('ui-workout-manager'); }
// --- WORKOUT MANAGER CONT. ---

function renderManagerList() {
    const list = document.getElementById('manager-list'); list.innerHTML = "";
    const keys = Object.keys(state.workouts);
    if(keys.length === 0) { list.innerHTML = "<p style='text-align:center; color:var(--text-dim)'>אין תוכניות שמורות</p>"; return; }

    keys.forEach(key => {
        const wo = state.workouts[key];
        const el = document.createElement('div');
        el.className = "manager-item";
        el.onclick = () => editWorkout(key); 
        let count = 0;
        if(Array.isArray(wo)) {
             wo.forEach(item => { if(item.type === 'cluster') count += item.exercises.length; else count++; });
        }

        el.innerHTML = `
            <div class="manager-info"><h3>${key}</h3><p>${count} תרגילים</p></div>
            <div class="manager-actions">
                <button class="btn-text-action" onclick="event.stopPropagation(); duplicateWorkout('${key}')">שכפל</button>
                <button class="btn-text-action delete" onclick="event.stopPropagation(); deleteWorkout('${key}')">מחק</button>
            </div>
        `;
        list.appendChild(el);
    });
}

function deleteWorkout(key) {
    if(confirm(`האם למחוק את תוכנית ${key}?`)) {
        delete state.workouts[key];
        if (state.workoutMeta[key]) delete state.workoutMeta[key];
        
        StorageManager.saveData(StorageManager.KEY_DB_WORKOUTS, state.workouts);
        StorageManager.saveData(StorageManager.KEY_META, state.workoutMeta);
        
        renderManagerList(); renderWorkoutMenu(); 
    }
}

function duplicateWorkout(key) {
    const newName = key + " Copy";
    if (state.workouts[newName]) { alert("שם התוכנית כבר קיים"); return; }
    const source = state.workouts[key];
    const copy = JSON.parse(JSON.stringify(source));
    
    if (state.workoutMeta[key]) {
        state.workoutMeta[newName] = JSON.parse(JSON.stringify(state.workoutMeta[key]));
        StorageManager.saveData(StorageManager.KEY_META, state.workoutMeta);
    }
    
    state.workouts[newName] = copy;
    StorageManager.saveData(StorageManager.KEY_DB_WORKOUTS, state.workouts);
    renderManagerList(); renderWorkoutMenu();
}

function createNewWorkout() {
    managerState.originalName = ''; managerState.currentName = 'New Plan';
    managerState.exercises = [];
    openEditorUI();
}

function editWorkout(key) {
    managerState.originalName = key; managerState.currentName = key;
    managerState.exercises = JSON.parse(JSON.stringify(state.workouts[key])); 
    openEditorUI();
}

function openEditorUI() {
    document.getElementById('editor-workout-name').value = managerState.currentName;
    const meta = state.workoutMeta[managerState.currentName] || {};
    document.getElementById('editor-deload-check').checked = !!meta.availableInDeload;
    renderEditorList();
    navigate('ui-workout-editor');
}

// --- EXERCISE MANAGER (CREATE / EDIT) ---

function openExerciseCreator() {
    document.getElementById('ex-config-title').innerText = "יצירת תרגיל חדש";
    document.getElementById('conf-ex-name').value = "";
    document.getElementById('conf-ex-muscle').value = "חזה";
    document.getElementById('conf-ex-base').value = "";
    document.getElementById('conf-ex-step').value = "2.5";
    document.getElementById('conf-ex-min').value = "";
    document.getElementById('conf-ex-max').value = "";
    document.getElementById('conf-ex-uni').checked = false; 
    
    document.getElementById('ex-config-modal').dataset.mode = "create";
    document.getElementById('ex-config-modal').style.display = 'flex';
}

function openExerciseEditor(exName) {
    const ex = state.exercises.find(e => e.name === exName);
    if (!ex) return;

    document.getElementById('ex-config-title').innerText = "עריכת תרגיל";
    document.getElementById('conf-ex-name').value = ex.name;
    document.getElementById('conf-ex-name').disabled = true;
    
    // Handle Biceps/Triceps mapping back to dropdown
    let muscleVal = ex.muscles[0] || "חזה";
    if (ex.muscles.includes('biceps')) muscleVal = "יד קדמית";
    else if (ex.muscles.includes('triceps')) muscleVal = "יד אחורית";
    
    document.getElementById('conf-ex-muscle').value = muscleVal;
    document.getElementById('conf-ex-step').value = ex.step || "2.5";
    
    document.getElementById('conf-ex-uni').checked = !!ex.isUnilateral;
    
    if (ex.manualRange) {
        document.getElementById('conf-ex-base').value = ex.manualRange.base || "";
        document.getElementById('conf-ex-min').value = ex.manualRange.min || "";
        document.getElementById('conf-ex-max').value = ex.manualRange.max || "";
    } else {
        document.getElementById('conf-ex-base').value = "";
        document.getElementById('conf-ex-min').value = ex.minW || "";
        document.getElementById('conf-ex-max').value = ex.maxW || "";
    }

    document.getElementById('ex-config-modal').dataset.mode = "edit";
    document.getElementById('ex-config-modal').dataset.target = exName;
    document.getElementById('ex-config-modal').style.display = 'flex';
}

// --- EXERCISE DATABASE MANAGER ---
function openExerciseDatabase() {
    navigate('ui-exercise-db');
    document.getElementById('db-search').value = '';
    renderExerciseDatabase();
}

function renderExerciseDatabase() {
    const list = document.getElementById('db-list');
    list.innerHTML = "";
    const searchVal = document.getElementById('db-search').value.toLowerCase();
    
    // Sort Alphabetically
    const sorted = [...state.exercises].sort((a,b) => a.name.localeCompare(b.name));
    
    const filtered = sorted.filter(ex => ex.name.toLowerCase().includes(searchVal));

    filtered.forEach(ex => {
        const row = document.createElement('div');
        row.className = "selector-item-row";
        
        row.innerHTML = `
            <div class="selector-item-info">
                <div>${ex.name}</div>
                <div style="font-size:0.75em; color:var(--text-dim);">${ex.muscles.join(', ')}</div>
            </div>
            <div class="selector-item-actions">
                <button class="btn-text-edit" onclick="openExerciseEditor('${ex.name.replace(/'/g, "\\'")}')">ערוך</button>
            </div>
        `;
        list.appendChild(row);
    });
}

function saveExerciseConfig() {
    const mode = document.getElementById('ex-config-modal').dataset.mode;
    const name = document.getElementById('conf-ex-name').value.trim();
    const muscleSelect = document.getElementById('conf-ex-muscle').value; // 'יד קדמית' or 'יד אחורית'
    const step = parseFloat(document.getElementById('conf-ex-step').value);
    const base = parseFloat(document.getElementById('conf-ex-base').value);
    const min = parseFloat(document.getElementById('conf-ex-min').value);
    const max = parseFloat(document.getElementById('conf-ex-max').value);
    const isUni = document.getElementById('conf-ex-uni').checked;

    if (!name) { alert("נא להזין שם תרגיל"); return; }

    // Map dropdown to muscle array
    let musclesArr = [muscleSelect];
    if (muscleSelect === 'יד קדמית') musclesArr = ['ידיים', 'biceps'];
    if (muscleSelect === 'יד אחורית') musclesArr = ['ידיים', 'triceps'];

    if (mode === 'create') {
        if (state.exercises.find(e => e.name === name)) { alert("שם תרגיל כבר קיים"); return; }
        
        const newEx = {
            name: name,
            muscles: musclesArr,
            step: step,
            isUnilateral: isUni,
            manualRange: {
                base: isNaN(base) ? undefined : base,
                min: isNaN(min) ? undefined : min,
                max: isNaN(max) ? undefined : max
            }
        };
        state.exercises.push(newEx);
        StorageManager.saveData(StorageManager.KEY_DB_EXERCISES, state.exercises);
        
        closeExConfigModal();
        alert("התרגיל נוצר בהצלחה!");
        
    } else {
        const targetName = document.getElementById('ex-config-modal').dataset.target;
        const exIndex = state.exercises.findIndex(e => e.name === targetName);
        if (exIndex === -1) return;

        state.exercises[exIndex].muscles = musclesArr;
        state.exercises[exIndex].step = step;
        state.exercises[exIndex].isUnilateral = isUni;
        
        if (!state.exercises[exIndex].manualRange) state.exercises[exIndex].manualRange = {};
        
        state.exercises[exIndex].manualRange.base = isNaN(base) ? undefined : base;
        state.exercises[exIndex].manualRange.min = isNaN(min) ? undefined : min;
        state.exercises[exIndex].manualRange.max = isNaN(max) ? undefined : max;
        
        if (!isNaN(min)) state.exercises[exIndex].minW = min;
        if (!isNaN(max)) state.exercises[exIndex].maxW = max;

        StorageManager.saveData(StorageManager.KEY_DB_EXERCISES, state.exercises);
        closeExConfigModal();
    }

    // Refresh the correct screen
    if (document.getElementById('ui-exercise-db').classList.contains('active')) {
        renderExerciseDatabase();
    } else if (document.getElementById('ui-exercise-selector').classList.contains('active')) {
        prepareSelector();
    }
}

function closeExConfigModal() {
    document.getElementById('ex-config-modal').style.display = 'none';
    document.getElementById('conf-ex-name').disabled = false; 
}
// --- WORKOUT EDITOR & CLUSTER SUPPORT ---

function renderEditorList() {
    const list = document.getElementById('editor-list');
    list.innerHTML = "";
    
    managerState.exercises.forEach((item, idx) => {
        if (item.type === 'cluster') {
            renderClusterItem(item, idx, list);
        } else {
            renderRegularItem(item, idx, list);
        }
    });
    
    StorageManager.saveSessionState();
}
function renderRegularItem(item, idx, list) {
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
        setControls = `<span style="font-size:0.8em; color:var(--text-dim); margin:0 5px;">1RM</span>`;
    }

    row.innerHTML = `
        <div class="row-info" onclick="openRestTimerModal(${idx})">${item.name}</div>
        <div class="editor-controls">
            <button class="badge-main ${item.isMain ? 'active' : ''}" onclick="toggleMainStatus(${idx})">MAIN</button>
            ${setControls}
            <button class="control-icon-btn" onclick="moveExInEditor(${idx}, -1)">▲</button>
            <button class="control-icon-btn" onclick="moveExInEditor(${idx}, 1)">▼</button>
            <button class="control-icon-btn" onclick="removeExFromEditor(${idx})" style="color:#ff453a; border-color: rgba(255,69,58,0.3);">✕</button>
        </div>
    `;
    list.appendChild(row);
}

function renderClusterItem(cluster, idx, list) {
    const box = document.createElement('div');
    box.className = "cluster-box";
    
    let html = `
    <div class="cluster-header">
        <div class="cluster-title">סבב / מעגל (Cluster)</div>
        <div class="editor-controls">
            <button class="control-icon-btn" onclick="moveExInEditor(${idx}, -1)">▲</button>
            <button class="control-icon-btn" onclick="moveExInEditor(${idx}, 1)">▼</button>
            <button class="control-icon-btn" onclick="removeExFromEditor(${idx})" style="color:#ff453a;">✕</button>
        </div>
    </div>
    <div class="input-grid" style="grid-template-columns: 1fr 1fr; margin-bottom:10px;">
        <div class="glass-card compact" style="margin:0; padding:8px;">
            <label>מס' סבבים</label>
            <div class="set-selector" style="justify-content:center;">
                <button class="set-btn" onclick="changeClusterRounds(${idx}, -1)">-</button>
                <span class="set-val">${cluster.rounds}</span>
                <button class="set-btn" onclick="changeClusterRounds(${idx}, 1)">+</button>
            </div>
        </div>
        <div class="glass-card compact" style="margin:0; padding:8px;">
            <label>מנוחה בסוף סבב</label>
            <div class="set-selector" style="justify-content:center;">
                <button class="set-btn" onclick="changeClusterRest(${idx}, -30)">-</button>
                <span class="set-val" style="width:40px;">${cluster.clusterRest}s</span>
                <button class="set-btn" onclick="changeClusterRest(${idx}, 30)">+</button>
            </div>
        </div>
    </div>
    <div class="cluster-content vertical-stack">
    `;

    cluster.exercises.forEach((ex, internalIdx) => {
        html += `
        <div class="editor-row" style="padding: 8px; background:rgba(255,255,255,0.05);">
            <div class="row-info" onclick="openRestTimerModal(${idx}, ${internalIdx})">${internalIdx+1}. ${ex.name}</div>
            <div class="editor-controls">
                 <button class="control-icon-btn" style="width:24px; height:24px;" onclick="removeExFromCluster(${idx}, ${internalIdx})">✕</button>
            </div>
        </div>`;
    });

    html += `
        <button class="btn-text" style="font-size:0.8em; padding:8px; color:var(--type-free);" onclick="openExerciseSelectorForCluster(${idx})">+ הוסף תרגיל לסבב</button>
    </div>`;

    box.innerHTML = html;
    list.appendChild(box);
}

function toggleMainStatus(idx) { managerState.exercises[idx].isMain = !managerState.exercises[idx].isMain; renderEditorList(); }
function changeSetCount(idx, delta) { let current = managerState.exercises[idx].sets; current += delta; if(current < 1) current = 1; managerState.exercises[idx].sets = current; renderEditorList(); }
function moveExInEditor(idx, dir) { if(idx + dir < 0 || idx + dir >= managerState.exercises.length) return; const temp = managerState.exercises[idx]; managerState.exercises[idx] = managerState.exercises[idx + dir]; managerState.exercises[idx + dir] = temp; renderEditorList(); }
function removeExFromEditor(idx) { managerState.exercises.splice(idx, 1); renderEditorList(); }
function changeClusterRounds(idx, delta) { let val = managerState.exercises[idx].rounds + delta; if(val < 1) val = 1; managerState.exercises[idx].rounds = val; renderEditorList(); }
function changeClusterRest(idx, delta) { let val = managerState.exercises[idx].clusterRest + delta; if(val < 0) val = 0; managerState.exercises[idx].clusterRest = val; renderEditorList(); }
function addClusterToEditor() { managerState.exercises.push({ type: 'cluster', rounds: 3, clusterRest: 120, exercises: [] }); renderEditorList(); }
function removeExFromCluster(clusterIdx, exIdx) { managerState.exercises[clusterIdx].exercises.splice(exIdx, 1); renderEditorList(); }

function saveWorkoutChanges() {
    const newName = document.getElementById('editor-workout-name').value.trim();
    if (!newName) { alert("נא להזין שם לתוכנית"); return; }
    if (managerState.exercises.length === 0) { alert("התוכנית ריקה!"); return; }

    if (newName !== managerState.originalName) {
        if (state.workouts[newName]) { alert("שם תוכנית זה כבר קיים"); return; }
        if (managerState.originalName) {
            delete state.workouts[managerState.originalName];
            delete state.workoutMeta[managerState.originalName];
        }
    }
    
    if (!state.workoutMeta[newName]) state.workoutMeta[newName] = {};
    state.workoutMeta[newName].availableInDeload = document.getElementById('editor-deload-check').checked;
    StorageManager.saveData(StorageManager.KEY_META, state.workoutMeta);

    state.workouts[newName] = managerState.exercises;
    StorageManager.saveData(StorageManager.KEY_DB_WORKOUTS, state.workouts);
    
    haptic('success');
    renderWorkoutMenu(); 
    navigate('ui-workout-manager');
    renderManagerList();
}

// --- REST TIMER EDITING ---
function openRestTimerModal(idx, internalIdx = null) {
    let ex;
    if (internalIdx !== null) { ex = managerState.exercises[idx].exercises[internalIdx]; managerState.editingTimerEx = { idx, internalIdx }; } 
    else { ex = managerState.exercises[idx]; managerState.editingTimerEx = { idx, internalIdx: null }; }
    document.getElementById('ex-settings-title').innerText = ex.name;
    const time = ex.restTime || (ex.isMain ? 120 : 90);
    document.getElementById('rest-time-display').innerText = time + "s";
    document.getElementById('exercise-settings-modal').style.display = 'flex';
}
function changeRestTime(delta) { const display = document.getElementById('rest-time-display'); let current = parseInt(display.innerText.replace('s', '')); current += delta; if(current < 0) current = 0; display.innerText = current + "s"; }
function saveExerciseSettings() {
    const val = parseInt(document.getElementById('rest-time-display').innerText.replace('s', ''));
    const { idx, internalIdx } = managerState.editingTimerEx;
    if (internalIdx !== null) managerState.exercises[idx].exercises[internalIdx].restTime = val;
    else managerState.exercises[idx].restTime = val;
    closeExerciseSettings(); renderEditorList();
}
function closeExerciseSettings() { document.getElementById('exercise-settings-modal').style.display = 'none'; managerState.editingTimerEx = null; }

// --- SMART EXERCISE SELECTOR ---
function openExerciseSelector() { managerState.activeClusterRef = null; prepareSelector(); }
function openExerciseSelectorForCluster(clusterIdx) { managerState.activeClusterRef = clusterIdx; prepareSelector(); }

function prepareSelector() {
    document.getElementById('selector-search').value = "";
    managerState.selectorFilter = 'all';
    updateSelectorChips();
    renderSelectorList();
    navigate('ui-exercise-selector');
}

function setSelectorFilter(filter, btn) { managerState.selectorFilter = filter; updateSelectorChips(); renderSelectorList(); }
function updateSelectorChips() {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    const btns = document.querySelectorAll('#ui-exercise-selector .chip');
    btns.forEach(b => { if(b.getAttribute('onclick').includes(`'${managerState.selectorFilter}'`)) b.classList.add('active'); });
}
function filterSelector() { renderSelectorList(); }

function renderSelectorList() {
    const list = document.getElementById('selector-list'); list.innerHTML = "";
    const searchVal = document.getElementById('selector-search').value.toLowerCase();
    
    const filtered = state.exercises.filter(ex => {
        const matchesFilter = managerState.selectorFilter === 'all' || ex.muscles.includes(managerState.selectorFilter);
        const matchesSearch = ex.name.toLowerCase().includes(searchVal);
        return matchesFilter && matchesSearch;
    });

    filtered.forEach(ex => {
        const row = document.createElement('div');
        row.className = "selector-item-row";
        
        row.innerHTML = `
            <div class="selector-item-info" onclick="selectExerciseFromList('${ex.name.replace(/'/g, "\\'")}')">${ex.name}</div>
            <div class="selector-item-actions">
                <button class="btn-text-edit" onclick="openExerciseEditor('${ex.name.replace(/'/g, "\\'")}')">ערוך</button>
            </div>
        `;
        list.appendChild(row);
    });
}

function selectExerciseFromList(exName) {
    const newExObj = { name: exName, isMain: false, sets: 3, restTime: 90 };
    if (managerState.activeClusterRef !== null) {
        newExObj.restTime = 30;
        managerState.exercises[managerState.activeClusterRef].exercises.push(newExObj);
    } else {
        managerState.exercises.push(newExObj);
    }
    navigate('ui-workout-editor');
    renderEditorList();
}

// --- WORKOUT FLOW ENGINE ---

function selectWeek(w) { 
    state.week = w; 
    renderWorkoutMenu(); 
    navigate('ui-workout-type'); 
}

function selectWorkout(t) {
    state.type = t; state.exIdx = 0; state.log = []; 
    state.completedExInSession = []; state.isFreestyle = false; state.isExtraPhase = false; state.isInterruption = false;
    state.workoutStartTime = Date.now();
    state.clusterMode = false;
    checkFlow(); 
}

function checkFlow() {
    const workoutList = state.workouts[state.type];
    
    if (state.exIdx >= workoutList.length) {
        navigate('ui-ask-extra');
        StorageManager.saveSessionState();
        return;
    }

    const item = workoutList[state.exIdx];

    if (item.type === 'cluster') {
        state.clusterMode = true;
        state.activeCluster = JSON.parse(JSON.stringify(item)); 
        state.clusterIdx = 0;
        state.clusterRound = 1;
        state.lastClusterRest = 30;
        showConfirmScreen();
    } else {
        state.clusterMode = false;
        state.activeCluster = null;
        if (isExOrVariationDone(item.name)) {
            state.exIdx++;
            checkFlow(); 
        } else {
            showConfirmScreen();
        }
    }
}

function showConfirmScreen(forceExName = null) {
    if (state.clusterMode && state.clusterIdx === 0 && !forceExName) {
        document.getElementById('confirm-ex-name').innerText = "סבב / מעגל (Cluster)";
        document.getElementById('confirm-ex-config').innerText = `סבב ${state.clusterRound} מתוך ${state.activeCluster.rounds}`;
        document.getElementById('confirm-ex-config').style.display = 'block';

        const historyContainer = document.getElementById('history-container');
        let listHtml = `<div class="vertical-stack" style="text-align:right; margin: 20px 0;">`;
        state.activeCluster.exercises.forEach((ex, i) => {
            listHtml += `<div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:12px; margin-bottom:5px;">${i+1}. ${ex.name}</div>`;
        });
        listHtml += `</div>`;
        historyContainer.innerHTML = listHtml;
        
        document.querySelector('.secondary-buttons-grid').style.display = 'none';
        navigate('ui-confirm');
        StorageManager.saveSessionState();
        return;
    }

    document.querySelector('.secondary-buttons-grid').style.display = 'grid';

    let exName = forceExName;
    let currentPlanItem = null;

    if (!exName) {
        currentPlanItem = state.workouts[state.type][state.exIdx];
        exName = currentPlanItem.name;
    }
    
    const exData = state.exercises.find(e => e.name === exName);
    if (!exData) { alert("שגיאה: התרגיל לא נמצא במאגר."); return; }

    state.currentEx = JSON.parse(JSON.stringify(exData));
    state.currentExName = exData.name;
    
    if (state.clusterMode) {
        const clusterEx = state.activeCluster.exercises[state.clusterIdx];
        if (clusterEx.restTime) state.currentEx.restTime = clusterEx.restTime;
    } else if (currentPlanItem && currentPlanItem.restTime) {
        state.currentEx.restTime = currentPlanItem.restTime;
    }

    document.getElementById('confirm-ex-name').innerText = exData.name;
    const configDiv = document.getElementById('confirm-ex-config');
    
    if (state.clusterMode) {
        configDiv.innerHTML = `חלק מסבב (${state.clusterRound}/${state.activeCluster.rounds})`;
        configDiv.style.display = 'block';
    } else if (currentPlanItem) {
        if (currentPlanItem.isMain) configDiv.innerHTML = "MAIN (מחושב 1RM)";
        else configDiv.innerHTML = `תוכנית: ${currentPlanItem.sets} סטים`;
        configDiv.style.display = 'block';
    } else {
        configDiv.style.display = 'none';
    }

    const swapBtn = document.getElementById('btn-swap-confirm');
    const addBtn = document.getElementById('btn-add-exercise');
    
    if (!state.isFreestyle && !state.isExtraPhase && !state.isInterruption) {
        swapBtn.style.visibility = 'visible';
        addBtn.style.visibility = 'visible'; 
    } else {
        swapBtn.style.visibility = 'hidden'; 
        addBtn.style.visibility = 'hidden'; 
    }

    const historyContainer = document.getElementById('history-container');
    historyContainer.innerHTML = "";
    
    const history = getLastPerformance(exName);
    
    if (history) {
        let rowsHtml = "";
        history.sets.forEach((setStr, idx) => {
            let weight = "-", reps = "-", rir = "-";
            try {
                const parts = setStr.split('x');
                if(parts.length > 1) {
                    weight = parts[0].replace('kg', '').trim();
                    const rest = parts[1];
                    const rirMatch = rest.match(/\(RIR (.*?)\)/);
                    reps = rest.split('(')[0].trim();
                    if(rirMatch) rir = rirMatch[1];
                }
            } catch(e) {}

            rowsHtml += `
            <div class="history-row">
                <div class="history-col set-idx">#${idx + 1}</div>
                <div class="history-col">${weight}</div>
                <div class="history-col">${reps}</div>
                <div class="history-col rir-note">${rir}</div>
            </div>`;
        });

        const gridHtml = `
        <div class="history-card-container">
            <div style="font-size:0.85em; color:var(--text-dim); text-align:right; margin-bottom:10px;">📅 ביצוע אחרון: ${history.date}</div>
            <div class="history-header">
                <div>סט</div>
                <div>משקל</div>
                <div>חזרות</div>
                <div>RIR</div>
            </div>
            <div class="history-list">${rowsHtml}</div>
        </div>
        `;
        historyContainer.innerHTML = gridHtml;
    }

    navigate('ui-confirm');
    StorageManager.saveSessionState();
}

function getLastPerformance(exName) {
    const archive = StorageManager.getArchive();
    for (const item of archive) {
        if (item.week === 'deload') continue;
        if (item.details && item.details[exName]) {
            return { date: item.date, sets: item.details[exName].sets };
        }
    }
    return null;
}

function confirmExercise(doEx) {
    if (state.clusterMode && state.clusterIdx === 0 && document.getElementById('confirm-ex-name').innerText.includes("Cluster")) {
        const firstExName = state.activeCluster.exercises[0].name;
        const exData = state.exercises.find(e => e.name === firstExName);
        state.currentEx = JSON.parse(JSON.stringify(exData));
        state.currentExName = exData.name;
        if(state.activeCluster.exercises[0].restTime) state.currentEx.restTime = state.activeCluster.exercises[0].restTime;
        resizeSets(1);
        startRecording();
        return;
    }

    if (!doEx) { 
        state.log.push({ skip: true, exName: state.currentExName }); 
        if(!state.clusterMode) state.completedExInSession.push(state.currentExName); 
        finishCurrentExercise(); 
        return; 
    }
    
    let isMain = state.currentEx.isCalc; 
    let targetSets = null;

    if (!state.isFreestyle && !state.isExtraPhase && !state.isInterruption) {
        if (state.clusterMode) {
             targetSets = 1;
             isMain = false;
        } else {
            const planItem = state.workouts[state.type][state.exIdx];
            if (planItem) {
                isMain = planItem.isMain;
                targetSets = planItem.sets;
            }
        }
    }

    if (isMain) {
        state.currentEx.isCalc = true; 
        setupCalculatedEx(); 
    } else {
        if (targetSets && targetSets > 0) resizeSets(targetSets);
        startRecording();
    }
}

function resizeSets(count) {
    const defaultReps = (state.currentEx.sets && state.currentEx.sets[0]) ? state.currentEx.sets[0].r : 10;
    const defaultWeight = (state.currentEx.sets && state.currentEx.sets[0]) ? state.currentEx.sets[0].w : 10;
    state.currentEx.sets = Array(count).fill({w: defaultWeight, r: defaultReps});
}

function setupCalculatedEx() {
    document.getElementById('rm-title').innerText = `${state.currentExName} 1RM`;
    const lastRM = StorageManager.getLastRM(state.currentExName);
    const baseRM = state.currentEx.baseRM || 50; 
    const p = document.getElementById('rm-picker'); p.innerHTML = "";
    const defaultRM = lastRM ? lastRM : baseRM;
    for(let i = 20; i <= 200; i += 2.5) {
        let o = new Option(i + " kg", i); if(i === defaultRM) o.selected = true; p.add(o);
    }
    navigate('ui-1rm');
    StorageManager.saveSessionState();
}

function save1RM() {
    state.rm = parseFloat(document.getElementById('rm-picker').value);
    StorageManager.saveRM(state.currentExName, state.rm);
    let percentages = []; let reps = [];
    const w = parseInt(state.week);
    if (w === 1) { percentages = [0.65, 0.75, 0.85, 0.75, 0.65]; reps = [5, 5, 5, 8, 10]; } 
    else if (w === 2) { percentages = [0.70, 0.80, 0.90, 0.80, 0.70, 0.70]; reps = [3, 3, 3, 8, 10, 10]; } 
    else if (w === 3) { percentages = [0.75, 0.85, 0.95, 0.85, 0.75, 0.75]; reps = [5, 3, 1, 8, 10, 10]; }
    else { percentages = [0.65, 0.75, 0.85, 0.75, 0.65]; reps = [5, 5, 5, 8, 10]; }
    state.currentEx.sets = percentages.map((pct, i) => ({ w: Math.round((state.rm * pct) / 2.5) * 2.5, r: reps[i] }));
    startRecording();
}

function startRecording() { 
    const existingLogs = state.log.filter(l => l.exName === state.currentExName && !l.skip && !l.isWarmup);
    if (existingLogs.length > 0) {
        state.setIdx = existingLogs.length;
        state.lastLoggedSet = existingLogs[existingLogs.length - 1];
    } else {
        state.setIdx = 0; 
        state.lastLoggedSet = null; 
    }

    document.getElementById('action-panel').style.display = 'none';
    document.getElementById('btn-submit-set').style.display = 'block';
    
    navigate('ui-main'); 
    initPickers(); 
    StorageManager.saveSessionState();
}

function isUnilateral(exName) {
    const exData = state.exercises.find(e => e.name === exName);
    if (exData && exData.isUnilateral !== undefined) {
        return exData.isUnilateral;
    }
    return unilateralKeywords.some(keyword => exName.includes(keyword));
}

function initPickers() {
    document.getElementById('ex-display-name').innerText = state.currentExName;
    const exHeader = document.querySelector('.exercise-header');
    const existingQueue = document.querySelector('.cluster-queue-container');
    if (existingQueue) existingQueue.remove();

    if (state.clusterMode) {
        const queueDiv = document.createElement('div');
        queueDiv.className = 'cluster-queue-container';
        let queueHtml = `<div class="queue-title">בהמשך הסבב:</div>`;
        let foundNext = false;
        for (let i = state.clusterIdx + 1; i < state.activeCluster.exercises.length; i++) {
            const exName = state.activeCluster.exercises[i].name;
            const isNext = !foundNext;
            queueHtml += `<div class="queue-item ${isNext ? 'next' : ''}">${isNext ? '• הבא: ' : ''}${exName}</div>`;
            foundNext = true;
        }
        if (!foundNext) queueHtml += `<div class="queue-item">--- סוף סבב ---</div>`;
        queueDiv.innerHTML = queueHtml;
        exHeader.parentNode.insertBefore(queueDiv, exHeader.nextSibling);
    }

    const badge = document.getElementById('set-counter');
    if (state.clusterMode) {
        badge.innerText = `ROUND ${state.clusterRound}/${state.activeCluster.rounds}`;
        badge.style.background = "var(--type-free)";
    } else {
        badge.innerText = `SET ${state.setIdx + 1}/${state.currentEx.sets.length}`;
        badge.style.background = "var(--accent)";
    }

    const target = state.currentEx.sets[state.setIdx];
    document.getElementById('set-notes').value = '';
    
    const hist = document.getElementById('last-set-info');
    if (state.lastLoggedSet) {
        hist.innerText = `סט אחרון: ${state.lastLoggedSet.w}kg x ${state.lastLoggedSet.r} (RIR ${state.lastLoggedSet.rir})`;
        hist.style.display = 'block';
    } else hist.style.display = 'none';
    
    document.getElementById('unilateral-note').style.display = isUnilateral(state.currentExName) ? 'block' : 'none';
    
    document.getElementById('btn-warmup').style.display = (state.setIdx === 0 && !state.clusterMode && ["Squat", "Deadlift", "Bench", "Overhead"].some(k => state.currentExName.includes(k))) ? 'block' : 'none';
    
    const timerArea = document.getElementById('timer-area');
    if (state.clusterMode && state.timerInterval) {
        timerArea.style.visibility = 'visible';
    } else if (state.setIdx > 0 && document.getElementById('action-panel').style.display === 'none') { 
        timerArea.style.visibility = 'visible'; 
    } else { 
        timerArea.style.visibility = 'hidden'; 
        if (!state.clusterMode) stopRestTimer(); 
    }

    const skipBtn = document.getElementById('btn-skip-exercise');
    skipBtn.style.display = (state.setIdx === 0) ? 'none' : 'block';

    const wPick = document.getElementById('weight-picker'); wPick.innerHTML = "";
    
    const savedWeight = StorageManager.getLastWeight(state.currentExName);
    const manualRange = state.currentEx.manualRange || {};
    
    let defaultW;
    if (state.currentEx.isCalc) defaultW = target.w;
    else defaultW = state.lastLoggedSet ? state.lastLoggedSet.w : (state.setIdx === 0 && savedWeight ? savedWeight : (target ? target.w : 0));
    
    if (!savedWeight && state.setIdx === 0 && manualRange.base) defaultW = manualRange.base;

    const step = state.currentEx.step || 2.5;
    
    let minW = manualRange.min !== undefined ? manualRange.min : (state.currentEx.minW !== undefined ? state.currentEx.minW : Math.max(0, defaultW - 40));
    let maxW = manualRange.max !== undefined ? manualRange.max : (state.currentEx.maxW !== undefined ? state.currentEx.maxW : defaultW + 50);
    
    if (minW < 0) minW = 0;

    for(let i = minW; i <= maxW; i = parseFloat((i + step).toFixed(2))) {
        let o = new Option(i + " kg", i); if(i === defaultW) o.selected = true; wPick.add(o);
    }
    
    const rPick = document.getElementById('reps-picker'); rPick.innerHTML = "";
    let currentR;
    if (state.currentEx.isCalc) currentR = target ? target.r : 5;
    else currentR = state.lastLoggedSet ? state.lastLoggedSet.r : (target ? target.r : 8);
    for(let i = 1; i <= 30; i++) { let o = new Option(i, i); if(i === currentR) o.selected = true; rPick.add(o); }
    
    const rirPick = document.getElementById('rir-picker'); rirPick.innerHTML = "";
    [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5].forEach(v => {
        let o = new Option(v === 0 ? "Fail" : v, v); if(v === 2) o.selected = true; rirPick.add(o);
    });
}

function resetAndStartTimer(customTime = null) {
    stopRestTimer(); state.seconds = 0; state.startTime = Date.now();
    let target = 90;
    if (customTime !== null) target = customTime;
    else if (state.currentEx.restTime) target = state.currentEx.restTime;
    else target = (state.exIdx === 0 && !state.clusterMode) ? 120 : 90;
    
    const circle = document.getElementById('timer-progress'); 
    const text = document.getElementById('rest-timer');
    const clusterBar = document.getElementById('cluster-timer-bar');
    const clusterText = document.getElementById('cluster-timer-text');

    const updateUI = (mins, secs, progress) => {
        if(text) text.innerText = `${mins}:${secs}`;
        if(circle) circle.style.strokeDashoffset = 283 - (progress * 283);
        if(clusterText) clusterText.innerText = `${mins}:${secs}`;
        if(clusterBar) clusterBar.style.strokeDashoffset = 283 - (progress * 283);
    };

    state.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        state.seconds = elapsed;
        const remaining = Math.max(0, target - elapsed); 
        const mins = Math.floor(state.seconds / 60).toString().padStart(2, '0');
        const secs = (state.seconds % 60).toString().padStart(2, '0');
        const progress = Math.min(state.seconds / target, 1);
        updateUI(mins, secs, progress);
        if (state.seconds === target) playBeep(2);
    }, 100); 
    
    StorageManager.saveSessionState();
}

function stopRestTimer() { if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; } }

function nextStep() {
    haptic('light');
    const wVal = parseFloat(document.getElementById('weight-picker').value);
    const noteVal = document.getElementById('set-notes').value.trim();
    const entry = { exName: state.currentExName, w: wVal, r: parseInt(document.getElementById('reps-picker').value), rir: document.getElementById('rir-picker').value, note: noteVal };
    
    StorageManager.saveWeight(state.currentExName, wVal);
    
    state.log.push(entry); state.lastLoggedSet = entry;
    StorageManager.saveSessionState(); 

    if (state.clusterMode) {
        state.lastClusterRest = state.currentEx.restTime || 30;
        if (state.clusterIdx < state.activeCluster.exercises.length - 1) {
            state.clusterIdx++;
            const nextExName = state.activeCluster.exercises[state.clusterIdx].name;
            const exData = state.exercises.find(e => e.name === nextExName);
            state.currentEx = JSON.parse(JSON.stringify(exData));
            state.currentExName = exData.name;
            if(state.activeCluster.exercises[state.clusterIdx].restTime) state.currentEx.restTime = state.activeCluster.exercises[state.clusterIdx].restTime;
            state.currentEx.sets = [{w:10, r:10}];
            state.setIdx = 0; state.lastLoggedSet = null; 
            initPickers();
            document.getElementById('timer-area').style.visibility = 'visible';
            resetAndStartTimer(state.lastClusterRest);
            return; 
        } else { finishCurrentExercise(); return; }
    }

    if (state.setIdx < state.currentEx.sets.length - 1) { 
        state.setIdx++; initPickers(); 
        document.getElementById('timer-area').style.visibility = 'visible'; 
        resetAndStartTimer();
    } else { 
        haptic('medium'); 
        document.getElementById('btn-submit-set').style.display = 'none';
        document.getElementById('btn-skip-exercise').style.display = 'none';
        document.getElementById('action-panel').style.display = 'block';
        let nextName = getNextExerciseName();
        document.getElementById('next-ex-preview').innerText = `הבא בתור: ${nextName}`;
        if (!state.clusterMode) { document.getElementById('timer-area').style.visibility = 'hidden'; stopRestTimer(); }
    }
}

function getNextExerciseName() {
    if (state.isInterruption) return "חזרה למסלול";
    if (state.isExtraPhase) return "תרגיל נוסף";
    if (state.exIdx < state.workouts[state.type].length - 1) return state.workouts[state.type][state.exIdx + 1].name;
    return "סיום אימון";
}

function finishCurrentExercise() {
    state.historyStack = state.historyStack.filter(s => s !== 'ui-main');
    
    if (state.clusterMode) {
        handleClusterFlow();
    } else {
        if (!state.completedExInSession.includes(state.currentExName)) state.completedExInSession.push(state.currentExName);
        
        if (state.isInterruption) { state.isInterruption = false; navigate('ui-confirm'); StorageManager.saveSessionState(); } 
        else if (state.isExtraPhase) {
            updateVariationUI();
            renderFreestyleChips();
            renderFreestyleList();
            navigate('ui-variation'); 
            StorageManager.saveSessionState(); 
        } 
        else if (state.isFreestyle) { 
            // STICKY FILTERS ACTIVE: We do not reset freestyleFilter here.
            navigate('ui-variation');
            updateVariationUI();
            renderFreestyleChips();
            renderFreestyleList();
            StorageManager.saveSessionState();
        } 
        else { checkFlow(); }
    }
}

function handleClusterFlow() {
    navigate('ui-cluster-rest');
    if (state.clusterRound < state.activeCluster.rounds) resetAndStartTimer(state.activeCluster.clusterRest);
    else stopRestTimer();
    renderClusterRestUI();
    StorageManager.saveSessionState();
}

function renderClusterRestUI() {
    const btnMain = document.getElementById('btn-cluster-main');
    const btnSkip = document.getElementById('btn-cluster-skip-text');
    if (state.clusterRound < state.activeCluster.rounds) {
        document.getElementById('cluster-status-text').innerText = `סיום סבב ${state.clusterRound} מתוך ${state.activeCluster.rounds}`;
        document.getElementById('btn-extra-round').style.display = 'none';
        btnMain.innerText = "התחל סבב הבא";
        btnMain.onclick = startNextRound;
        btnSkip.style.display = 'block';
    } else {
        document.getElementById('cluster-status-text').innerText = `הסבבים הושלמו (${state.activeCluster.rounds})`;
        document.getElementById('btn-extra-round').style.display = 'block';
        document.getElementById('cluster-timer-text').innerText = "✓";
        btnMain.innerText = "סיום";
        btnMain.onclick = finishCluster;
        btnSkip.style.display = 'none';
    }
    const listDiv = document.getElementById('cluster-next-list');
    listDiv.innerHTML = state.activeCluster.exercises.map((e,i) => `<div>${i+1}. ${e.name}</div>`).join('');
}

function startNextRound() {
    state.clusterRound++; state.clusterIdx = 0; stopRestTimer();
    const nextExName = state.activeCluster.exercises[0].name;
    const exData = state.exercises.find(e => e.name === nextExName);
    state.currentEx = JSON.parse(JSON.stringify(exData));
    state.currentExName = exData.name;
    if(state.activeCluster.exercises[0].restTime) state.currentEx.restTime = state.activeCluster.exercises[0].restTime;
    state.currentEx.sets = [{w:10, r:10}];
    startRecording();
}

function addExtraRound() { state.activeCluster.rounds++; renderClusterRestUI(); StorageManager.saveSessionState(); }
function finishCluster() { state.clusterMode = false; state.activeCluster = null; state.exIdx++; checkFlow(); }

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

function interruptWorkout() {
    state.isInterruption = true;
    updateVariationUI();
    renderFreestyleChips();
    renderFreestyleList();
    navigate('ui-variation');
    StorageManager.saveSessionState();
}

function resumeWorkout() { 
    state.isInterruption = false; 
    navigate('ui-confirm'); 
    StorageManager.saveSessionState(); 
}

function startExtraPhase() { 
    state.isExtraPhase = true; 
    updateVariationUI();
    renderFreestyleChips();
    renderFreestyleList();
    navigate('ui-variation'); 
    StorageManager.saveSessionState(); 
}

function finishExtraPhase() { 
    finish();
}

// --- FREESTYLE & LISTS (UNIFIED) ---
function startFreestyle() {
    state.type = 'Freestyle'; state.log = []; state.completedExInSession = [];
    state.isFreestyle = true; state.isExtraPhase = false; state.isInterruption = false;
    state.workoutStartTime = Date.now();
    
    // Default filter
    state.freestyleFilter = 'all'; 
    document.getElementById('freestyle-search').value = '';
    
    updateVariationUI();
    navigate('ui-variation');
    
    renderFreestyleChips();
    renderFreestyleList();
    
    StorageManager.saveSessionState(); 
}

function updateVariationUI() {
    const resumeBtn = document.getElementById('btn-var-resume');
    const finishExtraBtn = document.getElementById('btn-var-finish-extra');
    const contextContainer = document.getElementById('variation-context-container');
    const title = document.getElementById('variation-title');

    // Reset styles
    resumeBtn.style.display = 'none';
    finishExtraBtn.style.display = 'none';
    contextContainer.style.display = 'none';

    if (state.isInterruption) {
        title.innerText = "הוספת תרגיל";
        contextContainer.style.display = 'block';
        resumeBtn.style.display = 'flex';
    } else if (state.isExtraPhase) {
        title.innerText = "תרגילי אקסטרה";
        contextContainer.style.display = 'block';
        finishExtraBtn.style.display = 'block';
        finishExtraBtn.innerText = "סיום אימון";
    } else {
        title.innerText = "בחר תרגיל";
    }
}

function renderFreestyleChips() {
    const container = document.getElementById('variation-chips');
    container.innerHTML = "";
    
    // Updated V12.10.0: Biceps/Triceps split + Done tab
    const muscles = ['all', 'חזה', 'גב', 'רגליים', 'כתפיים', 'יד קדמית', 'יד אחורית', 'קליסטניקס', 'בוצעו'];
    const labels = { 'all': 'הכל' };
    
    muscles.forEach(m => {
        const btn = document.createElement('button');
        btn.className = `chip ${state.freestyleFilter === m ? 'active' : ''}`;
        btn.innerText = labels[m] || m;
        btn.onclick = () => { 
            state.freestyleFilter = m; 
            renderFreestyleChips(); 
            renderFreestyleList(); 
        };
        container.appendChild(btn);
    });
}

function renderFreestyleList() {
    const options = document.getElementById('variation-options');
    options.innerHTML = "";
    
    const searchVal = document.getElementById('freestyle-search').value.toLowerCase();
    
    let filtered = state.exercises.filter(ex => {
        const isDone = state.completedExInSession.includes(ex.name);
        
        // 1. Done Tab Logic
        if (state.freestyleFilter === 'בוצעו') return isDone;
        
        // 2. Hide done exercises from normal lists
        if (isDone) return false;

        // 3. Search Logic
        const matchesSearch = ex.name.toLowerCase().includes(searchVal);
        if (!matchesSearch) return false;

        // 4. Category Logic
        if (state.freestyleFilter === 'all') return true;
        if (state.freestyleFilter === 'יד קדמית') return ex.muscles.includes('biceps');
        if (state.freestyleFilter === 'יד אחורית') return ex.muscles.includes('triceps');
        
        return ex.muscles.includes(state.freestyleFilter);
    });
    
    // Sort alphabetically
    filtered.sort((a,b) => a.name.localeCompare(b.name));

    if (filtered.length === 0) {
        if (state.freestyleFilter === 'בוצעו') {
            options.innerHTML = `<p style="text-align:center; color:var(--text-dim); margin-top:20px;">טרם בוצעו תרגילים</p>`;
        } else {
            options.innerHTML = `<p style="text-align:center; color:var(--text-dim); margin-top:20px;">לא נמצאו תרגילים</p>`;
        }
        return;
    }

    filtered.forEach(ex => {
        const btn = document.createElement('button'); 
        btn.className = "menu-card";
        btn.innerHTML = `<span>${ex.name}</span><div class="chevron"></div>`;
        btn.onclick = () => {
            state.currentEx = JSON.parse(JSON.stringify(ex));
            state.currentExName = ex.name;
            if(!state.currentEx.sets || state.currentEx.sets.length < 3) state.currentEx.sets = [{w:10, r:10}, {w:10, r:10}, {w:10, r:10}];
            startRecording();
        };
        options.appendChild(btn);
    });
}

function finish() {
    haptic('success');
    StorageManager.clearSessionState(); 
    state.workoutDurationMins = Math.floor((Date.now() - state.workoutStartTime) / 60000);
    navigate('ui-summary');
    document.getElementById('summary-note').value = "";
    const workoutDisplayName = state.type; 
    const dateStr = new Date().toLocaleDateString('he-IL');
    let summaryText = `GYMPRO ELITE SUMMARY\n${workoutDisplayName} | Week ${state.week} | ${dateStr} | ${state.workoutDurationMins}m\n\n`;
    let grouped = {};
    state.log.forEach(e => {
        if (!grouped[e.exName]) grouped[e.exName] = { sets: [], vol: 0, hasWarmup: false };
        if (e.isWarmup) grouped[e.exName].hasWarmup = true;
        else if (!e.skip) {
            let weightStr = `${e.w}kg`;
            if (isUnilateral(e.exName)) weightStr += ` (יד אחת)`;
            
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
    if (userNote) text += `\n\n📝 הערות כלליות: ${userNote}`;
    const workoutDisplayName = state.type;
    const dateStr = new Date().toLocaleDateString('he-IL');
    const archiveObj = { id: Date.now(), date: dateStr, timestamp: Date.now(), type: workoutDisplayName, week: state.week, duration: state.workoutDurationMins, summary: text, details: state.lastWorkoutDetails, generalNote: userNote };
    StorageManager.saveToArchive(archiveObj);
    if (navigator.clipboard) { navigator.clipboard.writeText(text).then(() => { haptic('light'); alert("הסיכום נשמר בארכיון והועתק!"); location.reload(); }); } 
    else { const el = document.createElement("textarea"); el.value = text; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); alert("הסיכום נשמר בארכיון והועתק!"); location.reload(); }
}

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
            const weekStr = item.week ? ` • שבוע ${item.week}` : '';
            card.innerHTML = `<div class="archive-card-row"><input type="checkbox" class="archive-checkbox" data-id="${item.timestamp}"><div class="archive-info"><div style="display:flex; justify-content:space-between; width:100%;"><h3 style="margin:0;">${item.date}</h3><span style="font-size:0.8em; color:#8E8E93">${item.duration} דק'</span></div><p style="margin:0; color:#8E8E93; font-size:0.85em;">${item.type}${weekStr}</p></div><div class="chevron"></div></div>`;
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

function changeMonth(delta) { state.calendarOffset += delta; renderCalendar(); }
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
    for(let i = 0; i < firstDayIndex; i++) { const cell = document.createElement('div'); cell.className = "calendar-cell empty"; grid.appendChild(cell); }
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
                if(wo.type.includes('כתפיים - גב - חזה') || wo.type.includes('A')) dotClass = 'type-a';
                else if(wo.type.includes('רגליים - גב') || wo.type.includes('B')) dotClass = 'type-b';
                else if(wo.type.includes('חזה - כתפיים') || wo.type.includes('C')) dotClass = 'type-c';
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
            if(wo.type.includes('כתפיים - גב - חזה') || wo.type.includes('A')) dotColor = '#0A84FF';
            else if(wo.type.includes('רגליים - גב') || wo.type.includes('B')) dotColor = '#32D74B';
            else if(wo.type.includes('חזה - כתפיים') || wo.type.includes('C')) dotColor = '#FF9F0A';
            html += `
            <div class="mini-workout-item" onclick='openArchiveFromDrawer(${JSON.stringify(wo).replace(/'/g, "&#39;")})'>
                <div class="mini-dot" style="background:${dotColor}"></div>
                <div style="flex-grow:1;">
                    <div style="font-weight:600; font-size:0.95em;">${wo.type}</div>
                    <div style="font-size:0.8em; color:#8E8E93;">${wo.duration} דק' • ${new Date(wo.timestamp).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
                <div class="chevron"></div>
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
            if(confirm("האם לדרוס את הנתונים הקיימים ולשחזר מהגיבוי?")) { StorageManager.restoreData(data); alert("הנתונים שוחזרו בהצלחה!"); location.reload(); }
        } catch(err) { alert("שגיאה בטעינת הקובץ."); }
    };
    reader.readAsText(file);
}
function triggerConfigImport() { document.getElementById('import-config-file').click(); }
function processConfigImport(input) {
    const file = input.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) { try { StorageManager.importConfiguration(JSON.parse(e.target.result)); } catch(err) { alert("שגיאה בטעינת הקובץ."); } };
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

            if (isSkip) { details = "דילוג על תרגיל"; } 
            else if (isWarmup) { details = "סט חימום"; dotColor = "#ff3b30"; } 
            else { details = `${entry.w}kg x ${entry.r} (RIR ${entry.rir})`; if (entry.note) details += ` | 📝`; dotColor = "var(--accent)"; }

            html += `
            <div class="mini-workout-item" onclick="openEditSet(${index})">
                <div class="mini-dot" style="background:${dotColor}"></div>
                <div style="flex-grow:1;">
                    <div style="font-weight:600; font-size:0.9em;">${index + 1}. ${displayTitle}</div>
                    <div style="font-size:0.85em; color:#8E8E93;">${details}</div>
                </div>
                <div class="chevron"></div>
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
    if (entry.skip || entry.isWarmup) { alert("לא ניתן לערוך דילוגים או סטים של חימום כרגע."); return; }
    state.editingIndex = index;
    document.getElementById('edit-weight').value = entry.w;
    document.getElementById('edit-reps').value = entry.r;
    document.getElementById('edit-rir').value = entry.rir;
    document.getElementById('edit-note').value = entry.note || "";
    
    document.getElementById('btn-delete-set').style.display = 'block';
    closeDayDrawer(); 
    document.getElementById('edit-set-modal').style.display = 'flex';
}

function closeEditModal() { document.getElementById('edit-set-modal').style.display = 'none'; state.editingIndex = -1; }

function saveSetEdit() {
    if (state.editingIndex === -1) return;
    const w = parseFloat(document.getElementById('edit-weight').value);
    const r = parseInt(document.getElementById('edit-reps').value);
    const rir = document.getElementById('edit-rir').value;
    const note = document.getElementById('edit-note').value;
    if (isNaN(w) || isNaN(r)) { alert("נא להזין ערכים תקינים"); return; }
    
    state.log[state.editingIndex].w = w;
    state.log[state.editingIndex].r = r;
    state.log[state.editingIndex].rir = rir;
    state.log[state.editingIndex].note = note;

    if (state.editingIndex === state.log.length - 1) {
        state.lastLoggedSet = state.log[state.editingIndex];
        const hist = document.getElementById('last-set-info');
        hist.innerText = `סט אחרון: ${state.lastLoggedSet.w}kg x ${state.lastLoggedSet.r} (RIR ${state.lastLoggedSet.rir})`;
    }
    StorageManager.saveSessionState();
    closeEditModal(); haptic('success'); openSessionLog(); 
}

function deleteSetFromLog() {
    if (state.editingIndex === -1) return;
    if (!confirm("האם למחוק את הסט הזה?")) return;
    
    const removedEntry = state.log[state.editingIndex];
    state.log.splice(state.editingIndex, 1);
    
    if (removedEntry.exName === state.currentExName) {
        if (state.setIdx > 0) state.setIdx--;
        const relevantLogs = state.log.filter(l => l.exName === state.currentExName && !l.skip && !l.isWarmup);
        if (relevantLogs.length > 0) {
            state.lastLoggedSet = relevantLogs[relevantLogs.length - 1];
        } else {
            state.lastLoggedSet = null;
        }
    }
    
    StorageManager.saveSessionState();
    closeEditModal();
    haptic('warning');
    
    if (document.getElementById('ui-main').classList.contains('active')) {
        initPickers();
    }
    openSessionLog();
}

function openSwapMenu() {
    const container = document.getElementById('swap-container'); 
    container.innerHTML = "";
    
    const workoutList = state.workouts[state.type]; if (!workoutList) return;

    const variations = getSubstitutes(state.currentExName).filter(name => !state.completedExInSession.includes(name));
    if (variations.length > 0) {
        const titleVar = document.createElement('div');
        titleVar.className = "section-label";
        titleVar.innerText = `וריאציות (מחליף את הנוכחי)`;
        container.appendChild(titleVar);
        variations.forEach(vName => {
            const btn = document.createElement('button'); 
            btn.className = "menu-card"; 
            btn.innerHTML = `<span>${vName}</span><div class="chevron"></div>`;
            btn.onclick = () => {
                state.currentExName = vName;
                showConfirmScreen(vName);
            };
            container.appendChild(btn);
        });
    }

    const titleOrder = document.createElement('div');
    titleOrder.className = "section-label";
    titleOrder.innerText = `שאר האימון (החלף סדר)`;
    titleOrder.style.marginTop = "20px";
    container.appendChild(titleOrder);

    const remaining = workoutList.map((item, idx) => ({ item, idx })).filter(({ item, idx }) => idx > state.exIdx);

    if (remaining.length === 0) {
        const empty = document.createElement('p');
        empty.style.textAlign = 'center'; empty.style.color = 'var(--text-dim)'; empty.innerText = 'אין תרגילים נוספים להחלפה';
        container.appendChild(empty);
    } else {
        remaining.forEach(({ item, idx }) => {
            const btn = document.createElement('button'); 
            btn.className = "menu-card"; 
            btn.innerHTML = `<span>${item.name}</span><div class="chevron"></div>`;
            btn.onclick = () => { 
                const currentItem = state.workouts[state.type][state.exIdx];
                state.workouts[state.type][state.exIdx] = state.workouts[state.type][idx];
                state.workouts[state.type][idx] = currentItem;
                showConfirmScreen(); 
            };
            container.appendChild(btn);
        });
    }

    navigate('ui-swap-list');
    StorageManager.saveSessionState();
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
function markWarmupDone() { state.log.push({ exName: state.currentExName, isWarmup: true }); StorageManager.saveSessionState(); closeWarmup(); }
