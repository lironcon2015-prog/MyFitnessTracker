/**
 * AI Coach Module for GymPro Elite
 * Handles Gemini API communication, Context Injection, and Chart.js rendering.
 * Fixed: Model naming convention and URL structure.
 */

const AICoach = {
    KEY_STORAGE: 'gympro_ai_key',
    // שימוש בגרסת v1beta שהיא הנפוצה ביותר למודלים החדשים
    // שים לב: השם חייב להיות עם מקפים וללא רווחים
    MODEL_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    
    // מודל גיבוי למקרה שה-Flash לא זמין באזור/מפתח הספציפי
    BACKUP_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',

    // --- State Management ---
    getKey() {
        return localStorage.getItem(this.KEY_STORAGE);
    },

    saveKey() {
        const input = document.getElementById('ai-api-key');
        const key = input.value.trim();
        if (!key) { alert("נא להזין מפתח תקין"); return; }
        
        localStorage.setItem(this.KEY_STORAGE, key);
        alert("המפתח נשמר בהצלחה!");
        handleBackClick(); // Return to previous screen
    },

    init() {
        // Check if key exists when trying to open chat
        if (!this.getKey()) {
            if(confirm("AI Coach דורש הגדרת מפתח API. לעבור להגדרות?")) {
                navigate('ui-ai-settings');
            }
            return false;
        }
        navigate('ui-ai-chat');
        setTimeout(() => this.scrollToBottom(), 100);
        return true;
    },

    clearChat() {
        if(confirm("האם למחוק את היסטוריית הצ'אט הנוכחית?")) {
            document.getElementById('chat-container').innerHTML = `
                <div class="chat-bubble ai">
                    השיחה אופסה. אני מוכן לנתח את הנתונים מחדש!
                </div>
            `;
        }
    },

    // --- Prompt Engineering (The Brain) ---
    async generateSystemPrompt() {
        const allData = StorageManager.getAllData();
        const archive = allData.archive || [];
        const weights = allData.weights || {};
        const rms = allData.rms || {};

        // Summarize last 15 workouts to save tokens
        const recentHistory = archive.slice(0, 15).map(w => ({
            date: w.date,
            type: w.type,
            summary: w.summary
        }));

        const stats = {
            lastWorkout: archive.length > 0 ? archive[0] : "None",
            currentWeights: weights,
            estimated1RM: rms,
            totalWorkouts: archive.length
        };

        return `
        You are an elite Gym Coach for the app "GYMPRO ELITE".
        Language: Hebrew (Ivrit) ONLY.
        Tone: Professional, motivating, concise, analytical.

        User Data:
        ${JSON.stringify(stats)}

        Recent History (Last 15):
        ${JSON.stringify(recentHistory)}

        INSTRUCTIONS:
        1. Answer user questions based on their workout history.
        2. Identify plateaus or progress.
        3. CRITICAL: If the user asks for a visual progress report (graph, chart, "תראה לי התקדמות", "גרף"), 
           you MUST return a JSON object ONLY, wrapped in a special block.
           Do NOT write normal text if you are outputting a chart.
           
           Required JSON Format for Charts:
           {
             "type": "chart",
             "chartType": "line",
             "title": "Bench Press Progress",
             "labels": ["01/01", "08/01", "15/01"],
             "data": [60, 62.5, 65],
             "yLabel": "Weight (kg)",
             "description": "Here is your progress on Bench Press."
           }
           
           Logic for data extraction: Look through the "Recent History" summaries or "currentWeights" to estimate progress. 
           If precise data is missing, estimate based on available logs or tell the user data is insufficient.
        `;
    },

    // --- Communication ---
    async sendMessage() {
        const inputEl = document.getElementById('chat-input');
        const userText = inputEl.value.trim();
        if (!userText) return;

        // 1. UI: Add User Message
        this.addBubble(userText, 'user');
        inputEl.value = '';
        this.scrollToBottom();

        // 2. UI: Add Loading Indicator
        const loadingId = this.addLoadingBubble();
        this.scrollToBottom();

        try {
            const key = this.getKey();
            if (!key) throw new Error("Missing API Key");

            const systemPrompt = await this.generateSystemPrompt();

            const payload = {
                contents: [{
                    parts: [
                        { text: systemPrompt }, // System Context
                        { text: `User Question: ${userText}` } // Current Prompt
                    ]
                }]
            };

            // 3. API Call (Try Primary Endpoint)
            let response = await fetch(`${this.MODEL_ENDPOINT}?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Fallback Logic
            if (!response.ok) {
                console.warn("Primary model failed, trying backup...");
                response = await fetch(`${this.BACKUP_ENDPOINT}?key=${key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const data = await response.json();
            
            // Remove loading indicator
            document.getElementById(loadingId).remove();

            if (data.error) {
                console.error("Gemini Error:", data.error);
                this.addBubble(`שגיאה בתקשורת (Code ${data.error.code}): ${data.error.message}`, 'ai');
                return;
            }

            if (!data.candidates || data.candidates.length === 0) {
                 this.addBubble("התקבל מענה ריק מהשרת. נסה לשאול שוב.", 'ai');
                 return;
            }

            const aiText = data.candidates[0].content.parts[0].text;
            this.handleAIResponse(aiText);

        } catch (err) {
            document.getElementById(loadingId)?.remove();
            this.addBubble("אירעה שגיאה פנימית. אנא בדוק את החיבור לאינטרנט ואת המפתח.", 'ai');
            console.error(err);
        }
    },

    // --- Response Handling & Rendering ---
    handleAIResponse(text) {
        // Clean markdown code blocks if present (common with Gemini)
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Detect JSON (Chart)
        if (cleanText.startsWith('{') && cleanText.includes('"type": "chart"')) {
            try {
                const chartData = JSON.parse(cleanText);
                this.renderChartBubble(chartData);
            } catch (e) {
                // Fallback if JSON parse fails
                this.addBubble(text, 'ai'); 
            }
        } else {
            // Normal Text
            this.addBubble(text, 'ai');
        }
    },

    addBubble(text, type) {
        const container = document.getElementById('chat-container');
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type}`;
        // Convert newlines to breaks for text
        bubble.innerHTML = text.replace(/\n/g, '<br>');
        container.appendChild(bubble);
        this.scrollToBottom();
    },

    addLoadingBubble() {
        const container = document.getElementById('chat-container');
        const id = 'loading-' + Date.now();
        const bubble = document.createElement('div');
        bubble.id = id;
        bubble.className = 'chat-bubble ai';
        bubble.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
        container.appendChild(bubble);
        return id;
    },

    renderChartBubble(chartJson) {
        const container = document.getElementById('chat-container');
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble ai';
        
        // Add description text
        if (chartJson.description) {
            const desc = document.createElement('div');
            desc.style.marginBottom = "10px";
            desc.innerText = chartJson.description;
            bubble.appendChild(desc);
        }

        // Add Canvas
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper';
        const canvas = document.createElement('canvas');
        chartWrapper.appendChild(canvas);
        bubble.appendChild(chartWrapper);
        container.appendChild(bubble);

        // Render Chart.js
        try {
            new Chart(canvas, {
                type: chartJson.chartType || 'line',
                data: {
                    labels: chartJson.labels,
                    datasets: [{
                        label: chartJson.title,
                        data: chartJson.data,
                        borderColor: '#0A84FF',
                        backgroundColor: 'rgba(10, 132, 255, 0.2)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: '#fff' } }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: { color: 'rgba(255,255,255,0.1)' },
                            ticks: { color: '#8E8E93' },
                            title: { display: true, text: chartJson.yLabel || 'Value', color: '#8E8E93' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#8E8E93' }
                        }
                    }
                }
            });
        } catch (e) {
            console.error("Chart Error:", e);
            bubble.innerHTML += `<br><span style="color:red; font-size:0.8em;">שגיאה בטעינת הגרף</span>`;
        }

        this.scrollToBottom();
    },

    scrollToBottom() {
        const screen = document.getElementById('ui-ai-chat');
        screen.scrollTo({ top: screen.scrollHeight, behavior: 'smooth' });
    }
};

// Export for global usage
window.AICoach = AICoach;
