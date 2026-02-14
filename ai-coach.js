/**
 * AI Coach Module for GymPro Elite
 * Handles Gemini API communication, Context Injection, and Chart.js rendering.
 * Features: Smart Error Reporting & Clean Model List.
 */

const AICoach = {
    KEY_STORAGE: 'gympro_ai_key',
    
    // רשימת מודלים מעודכנת ל-2024/2025
    // הסרנו מודלים ישנים שגורמים לשגיאות 404
    AVAILABLE_MODELS: [
        'gemini-1.5-pro',      // העדיפות העליונה - מודל חכם
        'gemini-1.5-flash'     // גיבוי - מודל מהיר
    ],

    // --- State Management ---
    
    getKey() {
        const key = localStorage.getItem(this.KEY_STORAGE);
        return key ? key.trim() : null;
    },

    saveKey() {
        const input = document.getElementById('ai-api-key');
        const key = input.value.trim();
        if (!key) { alert("נא להזין מפתח תקין"); return; }
        
        localStorage.setItem(this.KEY_STORAGE, key);
        alert("המפתח נשמר בהצלחה!");
        handleBackClick(); 
    },

    init() {
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

    // --- Prompt Engineering (Pro Logic) ---
    async generateSystemPrompt() {
        const allData = StorageManager.getAllData();
        const archive = allData.archive || [];
        const weights = allData.weights || {};
        const rms = allData.rms || {};

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
        You are an elite Gym Coach for "GYMPRO ELITE".
        Language: Hebrew (Ivrit) ONLY.
        Tone: Professional, motivating, concise.

        User Data:
        ${JSON.stringify(stats)}

        Recent History:
        ${JSON.stringify(recentHistory)}

        INSTRUCTIONS:
        1. Answer based on workout history.
        2. Identify plateaus/progress.
        3. If the user asks "Does it work?" or "Are you connected?", reply with: "כן, אני מחובר ותקין! הגישה למודל Gemini 1.5 הצליחה."
        4. VISUALIZATION: If user asks for a chart/graph, return ONLY JSON with "type": "chart".
        `;
    },

    // --- Communication Core ---
    async sendMessage() {
        const inputEl = document.getElementById('chat-input');
        const userText = inputEl.value.trim();
        if (!userText) return;

        this.addBubble(userText, 'user');
        inputEl.value = '';
        this.scrollToBottom();

        const loadingId = this.addLoadingBubble();
        this.scrollToBottom();

        try {
            const key = this.getKey();
            if (!key) throw new Error("Missing API Key");

            const systemPrompt = await this.generateSystemPrompt();
            
            const payload = {
                contents: [{
                    parts: [
                        { text: systemPrompt },
                        { text: `User Question: ${userText}` }
                    ]
                }]
            };

            let success = false;
            let firstError = null; // נשמור את השגיאה הראשונה - היא החשובה
            let finalData = null;

            for (const model of this.AVAILABLE_MODELS) {
                console.log(`Trying model: ${model}...`);
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
                
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        finalData = await response.json();
                        success = true;
                        console.log(`Success with model: ${model}`);
                        break; 
                    } else {
                        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
                        const errorMessage = errorData.error?.message || response.statusText;
                        console.warn(`Failed model ${model}:`, errorMessage);
                        
                        // שמירת השגיאה הראשונה בלבד לצורך תצוגה למשתמש
                        if (!firstError) firstError = `Model: ${model}\nError: ${errorMessage}`;
                    }
                } catch (e) {
                    console.warn(`Network error with ${model}:`, e);
                    if (!firstError) firstError = `Network Error (${model}): ${e.message}`;
                }
            }

            document.getElementById(loadingId).remove();

            if (!success || !finalData) {
                // הצגת השגיאה של המודל הראשון (שהוא כנראה המועדף)
                this.addBubble(`⚠️ **שגיאת התחברות ל-AI**\n\nלא הצלחתי להתחבר. הנה השגיאה מהניסיון הראשון:\n${firstError}\n\nהמלצה: בדוק את המפתח או נסה ליצור מפתח חדש ב-Google AI Studio.`, 'ai');
                return;
            }

            if (finalData.error) {
                this.addBubble("שגיאה בתשובת ה-AI: " + finalData.error.message, 'ai');
                return;
            }

            if (!finalData.candidates || finalData.candidates.length === 0) {
                 this.addBubble("התקבל מענה ריק מהשרת.", 'ai');
                 return;
            }

            const aiText = finalData.candidates[0].content.parts[0].text;
            this.handleAIResponse(aiText);

        } catch (err) {
            document.getElementById(loadingId)?.remove();
            this.addBubble(`שגיאה קריטית: ${err.message}`, 'ai');
            console.error(err);
        }
    },

    // --- Response Handling ---
    handleAIResponse(text) {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        if (cleanText.startsWith('{') && cleanText.includes('"type": "chart"')) {
            try {
                const chartData = JSON.parse(cleanText);
                this.renderChartBubble(chartData);
            } catch (e) {
                this.addBubble(text, 'ai'); 
            }
        } else {
            this.addBubble(text, 'ai');
        }
    },

    addBubble(text, type) {
        const container = document.getElementById('chat-container');
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type}`;
        
        // המרת Markdown בסיסי (כוכביות להדגשה) ל-HTML
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); 
        formattedText = formattedText.replace(/\n/g, '<br>');
        
        bubble.innerHTML = formattedText;
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
        
        if (chartJson.description) {
            const desc = document.createElement('div');
            desc.style.marginBottom = "10px";
            desc.innerText = chartJson.description;
            bubble.appendChild(desc);
        }

        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper';
        const canvas = document.createElement('canvas');
        chartWrapper.appendChild(canvas);
        bubble.appendChild(chartWrapper);
        container.appendChild(bubble);

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
        if (screen) {
            screen.scrollTo({ top: screen.scrollHeight, behavior: 'smooth' });
        }
    }
};

window.AICoach = AICoach;
