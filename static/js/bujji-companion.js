// Web Audio API Sound Synthesizer for Bujji
const BujjiSynth = {
    ctx: null,

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser.", e);
        }
    },

    resume() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    playPop() {
        this.resume();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.07);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    },

    playChirp() {
        this.resume();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.1);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
    },

    playBleepBloop() {
        this.resume();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Bleep
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.08);

        // Bloop
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now + 0.08); // G5
        gain2.gain.setValueAtTime(0.15, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.22);
    },

    playSwoosh() {
        this.resume();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(250, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.45);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.07, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
    },

    playSuccess() {
        this.resume();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);

            gain.gain.setValueAtTime(0.15, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.25);
        });
    },

    playFailure() {
        this.resume();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.4);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
    },

    playWelcomeTune() {
        this.resume();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [392.00, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            gain.gain.setValueAtTime(0.08, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.35);
        });
    }
};

// Global click event to initialize/resume AudioContext (due to browser policy)
window.addEventListener('click', () => {
    BujjiSynth.resume();
}, { once: true });

// Phrases that Bujji companion says
const bujjiCompanionPhrases = [
    "Bujji online! Let's learn some English today! ⚡",
    "Did you complete your daily quiz challenge?",
    "Need a tip? Adjectives describe nouns, while adverbs modify verbs!",
    "Bleep boop! Power levels at 100%. Ready for syntax analysis!",
    "You are doing an amazing job. Keep moving forward! 🏆",
    "Did you know? 'The quick brown fox jumps over the lazy dog' uses every letter in the alphabet!",
    "Click me to test my rocket thrusters! 🚀",
    "Bujji database recalibrating... English skills: growing rapidly!",
    "Don't worry about mistakes. They are just diagnostics for learning! 🔧",
    "Is a word giving you trouble? Try breaking it down into prefix and suffix!"
];

// Interactive Bujji Companion Controller
class BujjiCompanion {
    constructor() {
        this.container = null;
        this.speechBubble = null;
        this.speechText = null;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.companionX = 0;
        this.companionY = 0;
        
        // Physics for tilt
        this.lastX = 0;
        this.lastY = 0;
        this.velX = 0;
        this.velY = 0;
        this.tiltTimer = null;
        this.wanderInterval = null;
        this.idleChirpInterval = null;

        this.init();
    }

    init() {
        // Only run on student pages with navbar, and NOT on the quiz page workspace
        const navLogo = document.getElementById("nav-bujji-logo");
        const isQuizPage = !!document.getElementById("mascot-graphic");

        if (!navLogo || isQuizPage) {
            // We are either not logged in, a faculty member, or on the quiz page.
            // On the quiz page, we don't spawn the floating companion, but we will bind sounds.
            this.bindQuizSounds();
            return;
        }

        // Check if companion already exists
        if (document.getElementById("bujji-companion")) return;

        this.createWidget();
        this.setupDragging();
        // this.startWandering(); // Disabled wandering as per request
        this.startIdleChirps();
        
        // Bind navbar Bujji logo to re-summon/interact
        navLogo.addEventListener("click", (e) => {
            e.preventDefault();
            this.summon();
        });
    }

    createWidget() {
        // Create container
        const container = document.createElement("div");
        container.id = "bujji-companion";
        container.className = "bujji-companion-container";
        
        // Setup initial position (bottom right)
        container.style.position = "fixed";
        container.style.bottom = "30px";
        container.style.right = "30px";
        container.style.zIndex = "9999";
        
        // Add HTML content
        container.innerHTML = `
            <div class="bujji-speech-bubble-wrapper">
                <div class="bujji-companion-bubble" style="padding: 12px !important; min-width: 200px; max-width: 260px;">
                    <span class="bujji-bubble-close">&times;</span>
                    <p class="bujji-bubble-text" style="margin-bottom: 8px !important; font-size: 13px !important; line-height: 1.45 !important; font-weight: 500 !important; color: #1E293B !important;">Bleep boop! Bujji is here to study English with you! 👋</p>
                    <div class="bujji-chat-input-row" style="display: flex; gap: 6px; margin-top: 8px; border-top: 1px solid #E2E8F0; padding-top: 8px;">
                        <input type="text" class="bujji-chat-input" placeholder="Ask me anything..." style="flex-grow: 1; border: 1px solid #CBD5E1; border-radius: 6px; padding: 6px 8px; font-size: 11.5px; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; background: #FFFFFF; color: #1E293B;">
                        <button class="bujji-chat-send" style="background: #0F172A; color: #FFFFFF; border: none; border-radius: 6px; padding: 6px 10px; font-size: 11.5px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background-color 0.15s ease;">Send</button>
                    </div>
                </div>
            </div>
            <div class="bujji-mascot-wrapper">
                <svg viewBox="0 0 200 220" class="bujji-companion-svg">
                    <defs>
                        <linearGradient id="metal-grad-comp" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#FDE7B9"/>
                            <stop offset="50%" stop-color="#EBAD45"/>
                            <stop offset="100%" stop-color="#9C7026"/>
                        </linearGradient>
                        <linearGradient id="fire-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#FFD000"/>
                            <stop offset="50%" stop-color="#FF6A00"/>
                            <stop offset="100%" stop-color="#FF0000" stop-opacity="0"/>
                        </linearGradient>
                        <filter id="neon-glow-comp" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <path class="bujji-flame" d="M85 160 Q100 210 100 215 Q100 210 115 160 Z" fill="url(#fire-grad)" />
                    <ellipse class="bujji-shadow" cx="100" cy="210" rx="30" ry="6" fill="rgba(0,0,0,0.15)"/>
                    <path d="M90 140 L110 140 L105 165 L95 165 Z" fill="#5E400B" />
                    <rect x="85" y="155" width="30" height="8" rx="4" fill="#EBAD45" />
                    <circle cx="100" cy="100" r="58" fill="url(#metal-grad-comp)" stroke="#5E400B" stroke-width="4" />
                    <path d="M44 91 C 55 85, 145 85, 156 91 L154 112 C 145 119, 55 119, 46 112 Z" fill="#0D1117" stroke="#5E400B" stroke-width="2" />
                    <g class="bujji-eyes">
                        <polygon points="58,98 87,98 84,105 60,105" fill="#61D3D5" filter="url(#neon-glow-comp)" />
                        <polygon points="60,99 85,99 83,104 61,104" fill="#E6FAFF" />
                        <polygon points="113,98 142,98 139,105 115,105" fill="#61D3D5" filter="url(#neon-glow-comp)" />
                        <polygon points="115,99 140,99 138,104 116,104" fill="#E6FAFF" />
                    </g>
                    <circle cx="50" cy="112" r="6" fill="#FD847E" opacity="0.6" filter="blur(1px)" />
                    <circle cx="150" cy="112" r="6" fill="#FD847E" opacity="0.6" filter="blur(1px)" />
                    <circle cx="100" cy="65" r="7" fill="#5E400B" />
                    <circle class="bujji-antenna-bulb" cx="100" cy="65" r="4" fill="#FFC800" filter="url(#neon-glow-comp)" />
                    <rect x="36" y="90" width="7" height="18" rx="2" fill="#EBAD45" stroke="#5E400B" stroke-width="1.5" />
                    <rect x="157" y="90" width="7" height="18" rx="2" fill="#EBAD45" stroke="#5E400B" stroke-width="1.5" />
                </svg>
            </div>
        `;
        
        document.body.appendChild(container);
        this.container = container;
        this.speechBubble = container.querySelector(".bujji-companion-bubble");
        this.speechText = container.querySelector(".bujji-bubble-text");
        
        // Position coordinates
        const rect = container.getBoundingClientRect();
        this.companionX = rect.left;
        this.companionY = rect.top;
        
        // Setup Chat Input handlers
        const chatInput = container.querySelector(".bujji-chat-input");
        const sendBtn = container.querySelector(".bujji-chat-send");
        
        if (sendBtn) {
            sendBtn.onmouseover = () => sendBtn.style.background = '#1E293B';
            sendBtn.onmouseout = () => sendBtn.style.background = '#0F172A';
            sendBtn.onclick = (e) => {
                e.stopPropagation();
                this.handleChatSubmit(chatInput, sendBtn);
            };
        }
        
        if (chatInput) {
            chatInput.onkeydown = (e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                    this.handleChatSubmit(chatInput, sendBtn);
                }
            };
            chatInput.onmousedown = (e) => e.stopPropagation();
            chatInput.ontouchstart = (e) => e.stopPropagation();
        }
        
        // Interactivity
        // Click on Bujji to trigger action
        container.querySelector(".bujji-mascot-wrapper").addEventListener("click", (e) => {
            if (this.isDragging) return;
            this.interact();
        });
        
        // Close button
        container.querySelector(".bujji-bubble-close").addEventListener("click", (e) => {
            e.stopPropagation();
            this.dismiss();
        });
    }

    async handleChatSubmit(input, btn) {
        if (!input || !btn) return;
        const msg = input.value.trim();
        if (!msg) return;
        
        input.value = '';
        this.say("Bujji is thinking... 🧠");
        
        input.disabled = true;
        btn.disabled = true;
        btn.style.opacity = '0.5';
        
        try {
            const response = await fetch('/api/bujji/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: msg })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.say(data.response);
                BujjiSynth.playChirp();
            } else {
                this.say("Bleep boop! Something went wrong. Let's try again! 🤖");
                BujjiSynth.playFailure();
            }
        } catch (e) {
            console.error("Chat error:", e);
            this.say("Bleep boop! System offline. Check your network! 🚀");
            BujjiSynth.playFailure();
        } finally {
            input.disabled = false;
            btn.disabled = false;
            btn.style.opacity = '1';
            input.focus();
        }
    }

    setupDragging() {
        const mascotWrapper = this.container.querySelector(".bujji-mascot-wrapper");
        
        const onDragStart = (clientX, clientY) => {
            BujjiSynth.resume();
            this.isDragging = true;
            this.container.classList.add("dragging");
            
            // Adjust coordinates explicitly
            const rect = this.container.getBoundingClientRect();
            this.dragStartX = clientX - rect.left;
            this.dragStartY = clientY - rect.top;
            
            this.container.style.transition = "none"; // Disable CSS slide transition during drag
            this.container.style.bottom = "auto";
            this.container.style.right = "auto";
            
            this.lastX = clientX;
            this.lastY = clientY;
            this.velX = 0;
            this.velY = 0;
            
            BujjiSynth.playPop();
            this.stopWandering();
            
            // Periodically calculate drag velocity for tilting
            this.tiltTimer = setInterval(() => {
                this.velX = this.velX * 0.5; // damp
                this.velY = this.velY * 0.5;
            }, 50);
        };
        
        const onDragMove = (clientX, clientY) => {
            if (!this.isDragging) return;
            
            // Calculate coordinates
            this.companionX = clientX - this.dragStartX;
            this.companionY = clientY - this.dragStartY;
            
            // Keep within viewport boundaries
            const width = this.container.offsetWidth;
            const height = this.container.offsetHeight;
            
            this.companionX = Math.max(10, Math.min(window.innerWidth - width - 10, this.companionX));
            this.companionY = Math.max(80, Math.min(window.innerHeight - height - 10, this.companionY));
            
            this.container.style.left = this.companionX + "px";
            this.container.style.top = this.companionY + "px";
            
            // Tilt physics based on movement velocity
            this.velX = clientX - this.lastX;
            this.velY = clientY - this.lastY;
            
            const tilt = Math.max(-25, Math.min(25, this.velX * 0.7)); // limit angle
            mascotWrapper.style.transform = `rotate(${tilt}deg) scale(1.05)`;
            
            this.lastX = clientX;
            this.lastY = clientY;
        };
        
        const onDragEnd = () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.container.classList.remove("dragging");
            clearInterval(this.tiltTimer);
            
            // Smoothly bounce back upright
            mascotWrapper.style.transform = "none";
            
            // Play a soft bounce sound
            BujjiSynth.playPop();
            
            // Resume wandering
            // this.startWandering(); // Disabled wandering as per request
        };
        
        // Mouse Listeners
        mascotWrapper.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return; // Only left click
            e.preventDefault();
            onDragStart(e.clientX, e.clientY);
            
            const handleMouseMove = (mvEvent) => onDragMove(mvEvent.clientX, mvEvent.clientY);
            const handleMouseUp = () => {
                onDragEnd();
                window.removeEventListener("mousemove", handleMouseMove);
                window.removeEventListener("mouseup", handleMouseUp);
            };
            
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        });
        
        // Touch Listeners (Mobile compatibility)
        mascotWrapper.addEventListener("touchstart", (e) => {
            if (e.touches.length !== 1) return;
            onDragStart(e.touches[0].clientX, e.touches[0].clientY);
            
            const handleTouchMove = (mvEvent) => {
                if (mvEvent.touches.length !== 1) return;
                onDragMove(mvEvent.touches[0].clientX, mvEvent.touches[0].clientY);
            };
            
            const handleTouchEnd = () => {
                onDragEnd();
                window.removeEventListener("touchmove", handleTouchMove);
                window.removeEventListener("touchend", handleTouchEnd);
            };
            
            window.addEventListener("touchmove", handleTouchMove, { passive: true });
            window.addEventListener("touchend", handleTouchEnd);
        }, { passive: true });
    }

    interact() {
        if (this.isDragging) return;
        
        // 1. Play cute chirp sound
        BujjiSynth.playChirp();
        
        // 2. Play jump-spin animation
        const svg = this.container.querySelector(".bujji-companion-svg");
        svg.classList.add("spin-active");
        setTimeout(() => {
            svg.classList.remove("spin-active");
        }, 700);
        
        // 3. Ask question: Joke or Quote of the day
        this.askQuestion("Hey there! Would you like to hear a joke or get a quote of the day? 😊", [
            {
                label: "Joke ⚡",
                className: "btn-primary",
                callback: () => {
                    const cleanJokes = [
                        "Why don't scientists trust atoms? Because they make up everything! ⚛️",
                        "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾",
                        "What do you call a fake noodle? An impasta! 🍝",
                        "Why did the tomato turn red? Because it saw the salad dressing! 🍅",
                        "What do you call a sleeping dinosaur? A dino-snore! 🦖",
                        "Why do we tell actors to 'break a leg'? Because every play has a cast! 🎭",
                        "How does a cucumber become a pickle? It goes through a jarring experience! 🥒",
                        "What kind of key opens a banana? A mon-key! 🔑🐒",
                        "Why did the math book look sad? Because it had too many problems! 📐",
                        "Why was the belt arrested? For holding up some pants! 👖"
                    ];
                    const randomJoke = cleanJokes[Math.floor(Math.random() * cleanJokes.length)];
                    this.say(randomJoke);
                    BujjiSynth.playSuccess();
                    this.burstParticles();
                }
            },
            {
                label: "Quote of the Day 🌟",
                className: "btn-blue",
                callback: () => {
                    const quotes = [
                        "The beautiful thing about learning is that no one can take it away from you. — B.B. King 📚",
                        "Live as if you were to die tomorrow. Learn as if you were to live forever. — Mahatma Gandhi 🕊️",
                        "Success is not final, failure is not fatal: it is the courage to continue that counts. — Winston Churchill 🏆",
                        "Believe you can and you're halfway there. — Theodore Roosevelt ✨",
                        "The mind is not a vessel to be filled, but a fire to be kindled. — Plutarch 🔥",
                        "It always seems impossible until it's done. — Nelson Mandela 🌍",
                        "Learning is a treasure that will follow its owner everywhere. — Chinese Proverb 💎",
                        "The only limit to our realization of tomorrow will be our doubts of today. — Franklin D. Roosevelt 🌅",
                        "You don't have to be great to start, but you have to start to be great. — Zig Ziglar 🚀",
                        "Education is the most powerful weapon which you can use to change the world. — Nelson Mandela 🎓"
                    ];
                    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                    this.say(randomQuote);
                    BujjiSynth.playSuccess();
                    this.burstParticles();
                }
            }
        ]);
        
        // 4. Create particle burst effect!
        this.burstParticles();
    }

    say(text) {
        if (!this.speechText || !this.speechBubble) return;
        
        // Remove any options container
        const existingButtons = this.speechBubble.querySelectorAll(".bujji-options-container");
        existingButtons.forEach(el => el.remove());
        
        this.speechText.textContent = text;
        this.speechBubble.classList.remove("hidden-bubble");
        this.speechBubble.style.opacity = "1";
        this.speechBubble.style.transform = "scale(1)";
        
        // Reset scale bounce animation
        this.speechBubble.style.animation = "none";
        void this.speechBubble.offsetWidth; // force paint
        this.speechBubble.style.animation = "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards";
    }

    askQuestion(questionText, options) {
        if (!this.speechText || !this.speechBubble) return;
        
        // Remove any existing buttons first
        const existingButtons = this.speechBubble.querySelectorAll(".bujji-options-container");
        existingButtons.forEach(el => el.remove());
        
        this.speechText.textContent = questionText;
        
        const optionsContainer = document.createElement("div");
        optionsContainer.className = "bujji-options-container";
        
        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "bujji-option-btn" + (opt.className ? " " + opt.className : "");
            btn.textContent = opt.label;
            btn.addEventListener("click", (e) => {
                e.stopPropagation(); // prevent triggering companion click again
                opt.callback();
            });
            optionsContainer.appendChild(btn);
        });
        
        this.speechBubble.appendChild(optionsContainer);
        
        this.speechBubble.classList.remove("hidden-bubble");
        this.speechBubble.style.opacity = "1";
        this.speechBubble.style.transform = "scale(1)";
        
        // Reset scale bounce animation
        this.speechBubble.style.animation = "none";
        void this.speechBubble.offsetWidth; // force paint
        this.speechBubble.style.animation = "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards";
    }

    dismiss() {
        BujjiSynth.playPop();
        
        // Shrink animation
        this.speechBubble.style.transition = "opacity 0.25s ease, transform 0.25s ease";
        this.speechBubble.style.opacity = "0";
        this.speechBubble.style.transform = "scale(0.8)";
        
        setTimeout(() => {
            this.speechBubble.classList.add("hidden-bubble");
        }, 250);
        
        // Give a prompt about how to summon back
        const navBujji = document.getElementById("nav-bujji-logo");
        if (navBujji) {
            navBujji.classList.add("bujji-pulse-cue");
        }
    }

    summon() {
        const isDismissed = this.speechBubble.classList.contains("hidden-bubble");
        
        // Play summon sound
        BujjiSynth.playBleepBloop();
        
        // Make navbar logo do a jump
        const logoSvg = document.querySelector(".mascot-svg-nav");
        if (logoSvg) {
            logoSvg.classList.remove("speaking-active");
            void logoSvg.offsetWidth;
            logoSvg.classList.add("speaking-active");
            setTimeout(() => logoSvg.classList.remove("speaking-active"), 1000);
        }
        
        // Remove pulse cue
        const navBujji = document.getElementById("nav-bujji-logo");
        if (navBujji) {
            navBujji.classList.remove("bujji-pulse-cue");
        }

        // If companion container is hidden/removed or bubble is closed
        if (isDismissed) {
            this.say("Bujji report: Online and ready! 🌟");
            
            // Animate mascot jump
            const svg = this.container.querySelector(".bujji-companion-svg");
            svg.classList.add("spin-active");
            setTimeout(() => svg.classList.remove("spin-active"), 700);
        } else {
            // If already visible, make it jump and say hello
            this.interact();
        }
    }

    startWandering() {
        this.stopWandering();
        
        this.wanderInterval = setInterval(() => {
            if (this.isDragging) return;
            
            // Choose a random position in the viewport (safe margins)
            const margin = 80;
            const cardWidth = this.container.offsetWidth;
            const cardHeight = this.container.offsetHeight;
            
            const randomX = margin + Math.random() * (window.innerWidth - cardWidth - margin * 2);
            const randomY = margin + Math.random() * (window.innerHeight - cardHeight - margin * 2);
            
            // Apply smooth transitions
            this.container.style.transition = "left 1.5s cubic-bezier(0.25, 1, 0.5, 1), top 1.5s cubic-bezier(0.25, 1, 0.5, 1)";
            
            // Tilt in direction of wander
            const currentRect = this.container.getBoundingClientRect();
            const dx = randomX - currentRect.left;
            const tiltAngle = dx > 0 ? 12 : -12;
            
            const mascotWrapper = this.container.querySelector(".bujji-mascot-wrapper");
            mascotWrapper.style.transition = "transform 0.4s ease";
            mascotWrapper.style.transform = `rotate(${tiltAngle}deg)`;
            
            // Move
            this.companionX = randomX;
            this.companionY = randomY;
            this.container.style.left = this.companionX + "px";
            this.container.style.top = this.companionY + "px";
            
            // Play swoosh sound
            BujjiSynth.playSwoosh();
            
            // Reset tilt and transition style when done
            setTimeout(() => {
                if (!this.isDragging) {
                    mascotWrapper.style.transform = "none";
                }
            }, 1200);
            
            // Update speech randomly during wander (40% chance)
            if (Math.random() < 0.4) {
                const randomPhrase = bujjiCompanionPhrases[Math.floor(Math.random() * bujjiCompanionPhrases.length)];
                this.say(randomPhrase);
            }
            
        }, 18000); // every 18 seconds
    }

    stopWandering() {
        if (this.wanderInterval) {
            clearInterval(this.wanderInterval);
            this.wanderInterval = null;
        }
    }

    startIdleChirps() {
        if (this.idleChirpInterval) clearInterval(this.idleChirpInterval);
        
        this.idleChirpInterval = setInterval(() => {
            if (this.isDragging) return;
            // Every 40 seconds, play a tiny chirp if the browser window is active
            if (document.visibilityState === "visible") {
                BujjiSynth.playChirp();
                
                // Antenna light pulse
                const bulb = this.container.querySelector(".bujji-antenna-bulb");
                if (bulb) {
                    bulb.setAttribute("fill", "#00FFDD"); // Change antenna light briefly!
                    setTimeout(() => bulb.setAttribute("fill", "#FFC800"), 600);
                }
            }
        }, 40000);
    }

    burstParticles() {
        const wrapper = this.container.querySelector(".bujji-mascot-wrapper");
        const rect = wrapper.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const colors = ["#EBAD45", "#FDE7B9", "#61D3D5", "#FD847E"];
        
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement("div");
            particle.className = "bujji-particle";
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 60;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            
            // Set custom properties for animation
            particle.style.setProperty("--tx", `${tx}px`);
            particle.style.setProperty("--ty", `${ty}px`);
            
            wrapper.appendChild(particle);
            
            // Remove after animation finishes
            setTimeout(() => {
                particle.remove();
            }, 800);
        }
    }

    bindQuizSounds() {
        // We are on the Quiz Page. Let's bind sounds to active quiz objects!
        // We listen for selection buttons.
        document.body.addEventListener("click", (e) => {
            const btn = e.target.closest(".option-btn");
            if (btn) {
                // Play selection pop sound
                BujjiSynth.playPop();
            }
        });
    }
}

// Instantiate companion globally on load
document.addEventListener("DOMContentLoaded", () => {
    window.bujjiCompanionInstance = new BujjiCompanion();
});
