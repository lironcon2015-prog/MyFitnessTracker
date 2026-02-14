/**
 * AI Coach Module for GymPro Elite
 * Handles Gemini API communication, Context Injection, and Chart.js rendering.
 * Fixed: Updated Model List for Gen 2 (v12.12.5 Hotfix)
 */

const AICoach = {
    KEY_STORAGE: 'gympro_ai_key',
    
    // LIST: Prioritize Gen 2 Models (Standard for 2026)
    // 1.5 Flash is likely deprecated/removed in v1beta.
    AVAILABLE_MODELS: [
        'gemini-2.0-flash',       // New Standard
        'gemini-2.0-flash-exp',   // Experimental/Fallback
        'gemini-2.0-pro-exp',     // High Intelligence
        'gemini-1.5-flash',       // Legacy Backup (might fail)
        'gemini-1.5-pro'          // Legacy Backup
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
        if (typeof handleBackClick === 'function') handleBackClick(); 
    },

    init() {
        if (!this.getKey()) {
            if(confirm("AI Coach דורש הגדרת מפתח API. לעבור להגדרות?")) {
                if (typeof navigate === 'function') navigate('ui-ai-settings');
            }
            return false;
        }
        if (typeof navigate === 'function') navigate('ui-ai-chat');
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

    // --- Prompt Engineering ---
    async generateSystemPrompt() {
        // Safe access to StorageManager
        const allData = (typeof StorageManager !== 'undefined') ? StorageManager.getAllData() : { archive: [], weights: {}, rms: {} };
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
        
        CRITICAL INSTRUCTION:
        If the user asks for a visual representation, graph, or chart, return ONLY a valid JSON object with "type": "chart".
        Do not wrap the JSON in markdown code blocks. Just raw JSON.
        
        JSON Format for Charts:
        {
          "type": "chart",
          "chartType": "line",
          "title": "Progress Title",
          "labels": ["Date1", "Date2", "Date3"],
          "data": [10, 20, 30],
          "yLabel": "Weight (kg)",
          "description": "Short text description of the chart."
        }

        User Data:
        ${JSON.stringify(stats)}

        Recent History:
        ${JSON.stringify(recentHistory)}
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
            
            // CONCATENATED PROMPT (Safest method for REST API)
            const fullPrompt = `${systemPrompt}\n\nUSER QUESTION:\n${userText}`;

            const payload = {
                contents: [{
                    parts: [{ text: fullPrompt }]
                }],
                // SAFETY SETTINGS (Prevent gym slang from being flagged as violence)
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            };

            let success = false;
            let firstError = null;
            let finalData = null;
            let usedModel = '';

            // Retry Loop
            for (const model of this.AVAILABLE_MODELS) {
                console.log(`[AI] Attempting model: ${model}`);
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
                        usedModel = model;
                        break; // Exit loop on success
                    } else {
                        const errData = await response.json().catch(() => ({}));
                        const errMsg = errData.error?.message || response.statusText;
                        console.warn(`[AI] Failed ${model}: ${errMsg}`);
                        if (!firstError) firstError = `Model: ${model}\nError: ${errMsg}`;
                    }
                } catch (e) {
                    console.warn(`[AI] Network fail ${model}: ${e.message}`);
                    if (!firstError) firstError = `Network: ${e.message}`;
                }
            }

            document.getElementById(loadingId).remove();

            if (!success || !finalData) {
                this.addBubble(`⚠️ **שגיאת התחברות ל-AI**\n\nכל המודלים נכשלו. השגיאה הראשונה הייתה:\n${firstError}`, 'ai');
                return;
            }

            // Validations
            if (finalData.error) {
                this.addBubble(`שגיאה מהשרת: ${finalData.error.message}`, 'ai');
                return;
            }

            if (finalData.promptFeedback && finalData.promptFeedback.blockReason) {
                this.addBubble(`⚠️ התוכן נחסם ע"י הגדרות הבטיחות של גוגל (${finalData.promptFeedback.blockReason}). נסה לנסח אחרת.`, 'ai');
                return;
            }

            if (!finalData.candidates || finalData.candidates.length === 0) {
                 this.addBubble("התקבל מענה ריק מהשרת (מוזר, נסה שוב).", 'ai');
                 return;
            }

            const aiText = finalData.candidates[0].content.parts[0].text;
            this.handleAIResponse(aiText);
            
            console.log(`[AI] Success using: ${usedModel}`);

        } catch (err) {
            const loader = document.getElementById(loadingId);
            if(loader) loader.remove();
            
            this.addBubble(`שגיאה קריטית: ${err.message}`, 'ai');
            console.error(err);
        }
    },

    // --- Response Handling ---
    handleAIResponse(text) {
        if (!text) return;
        
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        if (cleanText.startsWith('{') && cleanText.includes('"type": "chart"')) {
            try {
                const chartData = JSON.parse(cleanText);
                this.renderChartBubble(chartData);
            } catch (e) {
                console.warn("JSON Parse failed, showing text:", e);
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
