/**
 * Daily Challenge Interactive Practice Engine (Duolingo-style)
 * Supports 5 interactive exercise types, sound effects, lives system & level roadmap persistence.
 */

class DailyChallengeProgressManager {
    static STORAGE_KEY = 'ew_daily_challenge_progress_v1';

    static getProgress() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.error('Failed to parse daily challenge progress:', e);
            return {};
        }
    }

    static saveProgress(levelId, resultData) {
        const progress = this.getProgress();
        const existing = progress[levelId] || {};
        
        progress[levelId] = {
            completed: true,
            bestScore: Math.max(existing.bestScore || 0, resultData.score || 0),
            stars: Math.max(existing.stars || 0, resultData.stars || 1),
            claimedXP: existing.claimedXP || false,
            attempts: (existing.attempts || 0) + 1,
            lastCompletedAt: new Date().toISOString()
        };

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
        } catch (e) {
            console.error('Failed to save daily challenge progress:', e);
        }
        return progress[levelId];
    }

    static isUnlocked(levelId) {
        if (levelId === 1) return true;
        const progress = this.getProgress();
        return progress[levelId - 1] && progress[levelId - 1].completed;
    }

    static getLevelDetails(levelId) {
        const progress = this.getProgress();
        return progress[levelId] || { completed: false, bestScore: 0, stars: 0 };
    }
}

// Sound Synthesizer Utility (Web Audio API)
class DailySoundFx {
    static playCorrect() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
    }

    static playError() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
    }

    static playVictory() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
                gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.12);
                osc.stop(ctx.currentTime + idx * 0.12 + 0.25);
            });
        } catch (e) {}
    }
}

// Active Challenge Player State
window.DailyChallengeEngine = {
    activeLevel: null,
    exerciseIndex: 0,
    lives: 3,
    correctCount: 0,
    selectedOptionIndex: null,
    selectedChip: null,
    matchingPairsState: {},

    startLevel(levelId) {
        const levelData = window.DAILY_CHALLENGE_DATA.find(l => l.id === levelId);
        if (!levelData) return;

        this.activeLevel = levelData;
        this.exerciseIndex = 0;
        this.lives = 3;
        this.correctCount = 0;
        this.selectedOptionIndex = null;
        this.matchingPairsState = {};

        const modal = document.getElementById('daily-challenge-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.renderCurrentExercise();
        }
    },

    closeModal() {
        const modal = document.getElementById('daily-challenge-modal');
        if (modal) modal.style.display = 'none';
        if (window.renderRoadmap) window.renderRoadmap();
    },

    renderCurrentExercise() {
        const exercises = this.activeLevel.exercises;
        if (this.exerciseIndex >= exercises.length || this.lives <= 0) {
            this.renderSummary();
            return;
        }

        const ex = exercises[this.exerciseIndex];
        const progressPct = Math.round(((this.exerciseIndex + 1) / exercises.length) * 100);

        // Update Modal Header
        document.getElementById('dc-progress-bar').style.width = `${progressPct}%`;
        document.getElementById('dc-lives-container').innerHTML = '❤️'.repeat(this.lives);
        document.getElementById('dc-modal-title').innerText = `Level ${this.activeLevel.id}: ${this.activeLevel.title}`;
        document.getElementById('dc-ex-counter').innerText = `Question ${this.exerciseIndex + 1} of ${exercises.length}`;

        const container = document.getElementById('dc-exercise-body');
        container.innerHTML = '';

        if (ex.type === 'dialogue') {
            this.renderDialogue(ex, container);
        } else if (ex.type === 'matching') {
            this.renderMatching(ex, container);
        } else if (ex.type === 'fill_blank') {
            this.renderFillBlank(ex, container);
        } else if (ex.type === 'meaning') {
            this.renderMeaning(ex, container);
        } else {
            this.renderMeaning(ex, container);
        }

        document.getElementById('dc-feedback-box').style.display = 'none';
        document.getElementById('dc-btn-submit').style.display = 'inline-flex';
        document.getElementById('dc-btn-next').style.display = 'none';
    },

    renderDialogue(ex, container) {
        let html = `
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:16px; padding:20px; margin-bottom:20px;">
                <h4 style="font-size:15px; font-weight:800; color:#4F46E5; margin:0 0 14px 0;">💬 ${ex.title}</h4>
                <div style="display:flex; flex-direction:column; gap:12px;">
        `;

        ex.lines.forEach(line => {
            const speaker = ex.speakers[line.speaker];
            html += `
                <div style="display:flex; gap:12px; align-items:flex-start;">
                    <div style="width:38px; height:38px; border-radius:50%; background:#EEF2FF; display:flex; align-items:center; justify-content:center; font-size:20px; border:1px solid #C7D2FE;">${speaker.avatar}</div>
                    <div style="background:#FFFFFF; border:1px solid #E2E8F0; padding:10px 16px; border-radius:14px; box-shadow:0 2px 6px rgba(0,0,0,0.02); max-width:80%;">
                        <div style="font-size:11px; font-weight:800; color:#64748B; margin-bottom:2px;">${speaker.name}</div>
                        <div style="font-size:14px; font-weight:600; color:#0F172A;">${line.text}</div>
                    </div>
                </div>
            `;
        });

        html += `</div></div>`;
        html += `<p style="font-size:15px; font-weight:700; color:#0F172A; margin-bottom:14px;">${ex.question}</p>`;
        html += `<div style="display:flex; flex-direction:column; gap:10px;" id="dc-options-list">`;

        ex.options.forEach((opt, idx) => {
            html += `
                <button class="dc-option-btn" onclick="DailyChallengeEngine.selectOption(${idx})" id="dc-opt-${idx}" style="background:#FFFFFF; border:2px solid #E2E8F0; padding:14px 18px; border-radius:14px; font-size:14.5px; font-weight:700; color:#0F172A; text-align:left; cursor:pointer; transition:all 0.2s ease;">
                    ${opt}
                </button>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    },

    renderMatching(ex, container) {
        let html = `
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:16px; padding:20px; margin-bottom:20px;">
                <h4 style="font-size:15px; font-weight:800; color:#4F46E5; margin:0 0 8px 0;">🔗 ${ex.title}</h4>
                <p style="font-size:13.5px; color:#64748B; margin:0;">${ex.prompt}</p>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;" id="dc-matching-grid">
        `;

        const lefts = ex.pairs.map((p, i) => ({ text: p.left, id: i }));
        const rights = [...ex.pairs.map((p, i) => ({ text: p.right, id: i }))].sort(() => Math.random() - 0.5);

        html += `<div style="display:flex; flex-direction:column; gap:10px;">`;
        lefts.forEach(l => {
            html += `<button class="dc-match-btn" id="match-l-${l.id}" onclick="DailyChallengeEngine.selectMatchLeft(${l.id})" style="background:#FFFFFF; border:2px solid #E2E8F0; padding:12px 14px; border-radius:12px; font-size:13.5px; font-weight:700; color:#0F172A; text-align:left; cursor:pointer;">${l.text}</button>`;
        });
        html += `</div><div style="display:flex; flex-direction:column; gap:10px;">`;
        rights.forEach(r => {
            html += `<button class="dc-match-btn" id="match-r-${r.id}" onclick="DailyChallengeEngine.selectMatchRight(${r.id})" style="background:#FFFFFF; border:2px solid #E2E8F0; padding:12px 14px; border-radius:12px; font-size:13.5px; font-weight:700; color:#0F172A; text-align:left; cursor:pointer;">${r.text}</button>`;
        });
        html += `</div></div>`;

        container.innerHTML = html;
        this.matchingState = { left: null, right: null, matched: new Set() };
    },

    renderFillBlank(ex, container) {
        let html = `
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:16px; padding:24px; text-align:center; margin-bottom:20px;">
                <h4 style="font-size:15px; font-weight:800; color:#4F46E5; margin:0 0 12px 0;">✏️ ${ex.title}</h4>
                <p style="font-size:18px; font-weight:700; color:#0F172A; line-height:1.6;" id="dc-blank-sentence">
                    ${ex.sentence.replace('___', '<span id="dc-blank-target" style="border-bottom:3px dashed #4F46E5; padding:0 16px; color:#4F46E5; font-weight:900;">____</span>')}
                </p>
            </div>
            <p style="font-size:14px; font-weight:700; color:#64748B; margin-bottom:12px;">Select the correct word from the bank:</p>
            <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;" id="dc-word-bank">
        `;

        ex.wordBank.forEach(word => {
            html += `
                <button class="dc-chip-btn" onclick="DailyChallengeEngine.selectChip('${word}')" style="background:#FFFFFF; border:2px solid #C7D2FE; color:#4F46E5; font-size:15px; font-weight:800; padding:10px 20px; border-radius:24px; cursor:pointer; box-shadow:0 4px 10px rgba(99,102,241,0.08); transition:all 0.2s ease;">
                    ${word}
                </button>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
        this.selectedChip = null;
    },

    renderMeaning(ex, container) {
        let html = `
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:16px; padding:20px; margin-bottom:20px;">
                <h4 style="font-size:15px; font-weight:800; color:#4F46E5; margin:0 0 8px 0;">🧠 ${ex.title}</h4>
                <p style="font-size:16px; font-weight:700; color:#0F172A; margin:0; line-height:1.5;">${ex.prompt}</p>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px;" id="dc-options-list">
        `;

        ex.options.forEach((opt, idx) => {
            html += `
                <button class="dc-option-btn" onclick="DailyChallengeEngine.selectOption(${idx})" id="dc-opt-${idx}" style="background:#FFFFFF; border:2px solid #E2E8F0; padding:14px 18px; border-radius:14px; font-size:14.5px; font-weight:700; color:#0F172A; text-align:left; cursor:pointer; transition:all 0.2s ease;">
                    ${opt}
                </button>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    },

    selectOption(idx) {
        this.selectedOptionIndex = idx;
        document.querySelectorAll('.dc-option-btn').forEach((btn, i) => {
            if (i === idx) {
                btn.style.borderColor = '#4F46E5';
                btn.style.background = '#EEF2FF';
                btn.style.color = '#4F46E5';
            } else {
                btn.style.borderColor = '#E2E8F0';
                btn.style.background = '#FFFFFF';
                btn.style.color = '#0F172A';
            }
        });
    },

    selectChip(word) {
        this.selectedChip = word;
        const target = document.getElementById('dc-blank-target');
        if (target) target.innerText = word;
    },

    selectMatchLeft(id) {
        if (this.matchingState.matched.has(id)) return;
        this.matchingState.left = id;
        document.querySelectorAll('[id^="match-l-"]').forEach(b => b.style.borderColor = '#E2E8F0');
        document.getElementById(`match-l-${id}`).style.borderColor = '#4F46E5';
        this.checkMatchingPair();
    },

    selectMatchRight(id) {
        this.matchingState.right = id;
        document.querySelectorAll('[id^="match-r-"]').forEach(b => b.style.borderColor = '#E2E8F0');
        document.getElementById(`match-r-${id}`).style.borderColor = '#4F46E5';
        this.checkMatchingPair();
    },

    checkMatchingPair() {
        const { left, right } = this.matchingState;
        if (left !== null && right !== null) {
            if (left === right) {
                DailySoundFx.playCorrect();
                document.getElementById(`match-l-${left}`).style.background = '#DCFCE7';
                document.getElementById(`match-r-${right}`).style.background = '#DCFCE7';
                this.matchingState.matched.add(left);
            } else {
                DailySoundFx.playError();
                document.getElementById(`match-l-${left}`).style.background = '#FEE2E2';
                document.getElementById(`match-r-${right}`).style.background = '#FEE2E2';
            }
            this.matchingState.left = null;
            this.matchingState.right = null;
        }
    },

    submitAnswer() {
        const ex = this.activeLevel.exercises[this.exerciseIndex];
        let isCorrect = false;

        if (ex.type === 'dialogue' || ex.type === 'meaning') {
            if (this.selectedOptionIndex === null) return;
            isCorrect = (this.selectedOptionIndex === ex.correctIndex);
        } else if (ex.type === 'fill_blank') {
            if (!this.selectedChip) return;
            isCorrect = (this.selectedChip === ex.correctAnswer);
        } else if (ex.type === 'matching') {
            isCorrect = (this.matchingState.matched.size === ex.pairs.length);
        }

        const fbBox = document.getElementById('dc-feedback-box');
        fbBox.style.display = 'block';

        if (isCorrect) {
            DailySoundFx.playCorrect();
            this.correctCount++;
            fbBox.style.background = '#F0FDF4';
            fbBox.style.borderColor = '#86EFAC';
            fbBox.innerHTML = `
                <div style="font-size:16px; font-weight:900; color:#16A34A;">🎉 Excellent! Correct Answer</div>
                <p style="font-size:13.5px; color:#15803D; margin:4px 0 0 0;">${ex.explanation || 'Great job!'}</p>
            `;
        } else {
            DailySoundFx.playError();
            this.lives--;
            fbBox.style.background = '#FEF2F2';
            fbBox.style.borderColor = '#FCA5A5';
            fbBox.innerHTML = `
                <div style="font-size:16px; font-weight:900; color:#DC2626;">❌ Oops! Not quite right</div>
                <p style="font-size:13.5px; color:#991B1B; margin:4px 0 0 0;">${ex.explanation || 'Keep practicing!'}</p>
            `;
        }

        document.getElementById('dc-btn-submit').style.display = 'none';
        document.getElementById('dc-btn-next').style.display = 'inline-flex';
    },

    nextExercise() {
        this.exerciseIndex++;
        this.selectedOptionIndex = null;
        this.selectedChip = null;
        this.renderCurrentExercise();
    },

    renderSummary() {
        const total = this.activeLevel.exercises.length;
        const pct = Math.round((this.correctCount / total) * 100);
        const passed = pct >= 60 && this.lives > 0;
        const stars = pct >= 90 ? 3 : (pct >= 70 ? 2 : 1);

        if (passed) {
            DailySoundFx.playVictory();
            DailyChallengeProgressManager.saveProgress(this.activeLevel.id, { score: pct, stars: stars });
        }

        const container = document.getElementById('dc-exercise-body');
        container.innerHTML = `
            <div style="text-align:center; padding:32px 16px;">
                <div style="font-size:54px; margin-bottom:12px;">${passed ? '🏆' : '💔'}</div>
                <h3 style="font-size:26px; font-weight:900; color:#0F172A; margin:0 0 6px 0;">
                    ${passed ? 'Level Completed!' : 'Level Failed!'}
                </h3>
                <p style="font-size:14.5px; color:#64748B; margin:0 0 20px 0;">
                    ${passed ? `You earned ${this.activeLevel.xp} XP!` : 'Don\'t give up! Try again to unlock the next level.'}
                </p>

                <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:18px; padding:20px; display:flex; justify-content:space-around; max-width:360px; margin:0 auto 24px auto;">
                    <div>
                        <div style="font-size:22px; font-weight:900; color:#4F46E5;">${pct}%</div>
                        <div style="font-size:11px; font-weight:700; color:#64748B;">ACCURACY</div>
                    </div>
                    <div>
                        <div style="font-size:22px; font-weight:900; color:#D97706;">${'⭐'.repeat(stars)}</div>
                        <div style="font-size:11px; font-weight:700; color:#64748B;">STARS</div>
                    </div>
                    <div>
                        <div style="font-size:22px; font-weight:900; color:#16A34A;">+${passed ? this.activeLevel.xp : 0}</div>
                        <div style="font-size:11px; font-weight:700; color:#64748B;">XP</div>
                    </div>
                </div>

                <button onclick="DailyChallengeEngine.closeModal()" style="background:linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color:#FFFFFF; font-size:15px; font-weight:800; padding:12px 32px; border-radius:24px; border:none; cursor:pointer; box-shadow:0 6px 18px rgba(79,70,229,0.3);">
                    Return to Path Roadmap
                </button>
            </div>
        `;

        document.getElementById('dc-feedback-box').style.display = 'none';
        document.getElementById('dc-btn-submit').style.display = 'none';
        document.getElementById('dc-btn-next').style.display = 'none';
    }
};
