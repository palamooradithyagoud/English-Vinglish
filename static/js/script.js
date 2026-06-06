/**
 * Level 1 - English Basics
 * English Learning Platform JavaScript Controller (Phase 2)
 * 
 * Dynamically communicates with the Flask backend API, manages quiz state,
 * renders database-driven questions, evaluates student answers on the server,
 * updates the HUD, and loads interactive result screens.
 */

// Mascot Dialogue Prompts based on Categories
const mascotPrompts = {
    "WELCOME": "Bujji online. Level 1 quiz loaded. Ready to test English basics! Make your selection.",
    "VOCABULARY": "Analyzing vocabulary databases... Choose the option that defines this term correctly.",
    "SYNONYMS": "Scanning synonym registers. Identify the word with the equivalent semantic signature.",
    "ANTONYMS": "Antonyms represent binary opposites. Select the correct inverse word.",
    "ARTICLES": "Article logic unit active. Determine if 'a', 'an', or 'the' fits the syntactic slot.",
    "FILL IN THE BLANKS": "Syntax analysis required. Please fill in the blank to complete the statement.",
    "GRAMMAR": "Grammar logic unit active. Identify the correct grammatical structure.",
    "TENSES": "Scanning time markers and verb states. Choose the correct tense form.",
    "ERROR DETECTION": "System scanning for syntactic anomalies. Locate the incorrect part.",
    "SENTENCE REARRANGEMENT": "Rearranging semantic blocks. Select the correct sequence of words.",
    "PREPOSITIONS": "Analyzing spatial and temporal relations. Fill in the correct preposition.",
    "CONJUNCTIONS": "Evaluating logical linkers. Choose the appropriate conjunction.",
    "READING COMPREHENSION": "Reading comprehension processor active. Infer the correct details.",
    "MIDWAY": "Quiz progression: 50% complete. System temperature stable. Keep going, partner!",
    "ALMOST_DONE": "Quiz progression: 85% complete. Power reserves at maximum. Let's finish strong!",
    "PASS": "Level 1 cleared! Excellent performance. System authorization granted for Level 2!",
    "FAIL": "System Error: Score below 70%. Re-calibrating databases. Click Retry to run diagnostics again."
};

// ==========================================================================
// STATE VARIABLES
// ==========================================================================
let questions = [];
let currentIndex = 0;
let userAnswers = [];

// ==========================================================================
// DOM ELEMENT SELECTORS
// ==========================================================================
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const scoreCounter = document.getElementById("score-counter");

const quizWorkspace = document.getElementById("quiz-workspace");
const resultsContainer = document.getElementById("results-container");

const mascotBubble = document.getElementById("mascot-bubble");
const mascotGraphic = document.getElementById("mascot-graphic");

const categoryBadge = document.getElementById("category-badge");
const questionText = document.getElementById("question-text");
const optionsGrid = document.getElementById("options-grid");

const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const btnClose = document.getElementById("btn-close");

// Results screen selectors
const resultsTitle = document.getElementById("results-title");
const resultsSubtitle = document.getElementById("results-subtitle");
const resultsMascotGraphic = document.getElementById("results-mascot-graphic");
const resultBadgeContainer = document.getElementById("result-badge-container");
const unlockedBadge = document.getElementById("unlocked-badge");
const circularRing = document.getElementById("circular-percentage-ring");
const circularText = document.getElementById("circular-percentage-text");
const statTotal = document.getElementById("stat-total");
const statCorrect = document.getElementById("stat-correct");
const statWrong = document.getElementById("stat-wrong");
const btnResultAction = document.getElementById("btn-result-action");
const reviewList = document.getElementById("review-list");

// ==========================================================================
// CORE FUNCTIONS
// ==========================================================================

/**
 * Fetches questions from backend and initializes the quiz
 */
async function initQuiz() {
    try {
        const level = typeof QUIZ_LEVEL !== 'undefined' ? QUIZ_LEVEL : 1;
        mascotPrompts["WELCOME"] = `Bujji online. Level ${level} quiz loaded. Ready to test English skills! Make your selection.`;
        mascotPrompts["PASS"] = `Level ${level} cleared! Excellent performance. System authorization granted for Level ${level + 1}!`;
        
        const response = await fetch(QUESTIONS_API_URL);
        if (!response.ok) {
            throw new Error("Failed to fetch questions from the server.");
        }
        
        questions = await response.json();
        
        if (questions.length === 0) {
            mascotBubble.textContent = `Error: No questions found for Level ${level}.`;
            return;
        }
        
        currentIndex = 0;
        userAnswers = new Array(questions.length).fill(null);
        
        // Hide results & show quiz workspace
        resultsContainer.classList.add("hidden");
        quizWorkspace.classList.remove("hidden");
        document.getElementById("app-footer").classList.remove("hidden");
        
        updateMascotSpeech("WELCOME");
        loadQuestion(currentIndex);
    } catch (error) {
        console.error(error);
        mascotBubble.textContent = "Bujji database offline. Could not load quiz questions.";
    }
}

/**
 * Renders a question onto the card based on the given index
 * @param {number} index - Index of the question to load
 */
function loadQuestion(index) {
    if (questions.length === 0) return;
    
    const question = questions[index];
    
    // Update question metadata
    categoryBadge.textContent = question.category;
    questionText.textContent = question.text;
    
    // Dynamic mascot response based on category & index checkpoints
    if (index === Math.floor(questions.length / 2)) {
        updateMascotSpeech("MIDWAY");
    } else if (index === questions.length - 3) {
        updateMascotSpeech("ALMOST_DONE");
    } else {
        updateMascotSpeech(question.category);
    }
    
    // Render options
    optionsGrid.innerHTML = "";
    question.options.forEach((option, idx) => {
        const optionBtn = document.createElement("button");
        optionBtn.className = "option-btn";
        
        // Match selection history
        if (userAnswers[index] === idx) {
            optionBtn.classList.add("selected");
        }
        
        // Add option letter badge (A, B, C, D)
        const letterBadge = document.createElement("span");
        letterBadge.className = "option-badge";
        letterBadge.textContent = String.fromCharCode(65 + idx); // 65 is ASCII for 'A'
        
        const optionTextNode = document.createElement("span");
        optionTextNode.textContent = option;
        
        optionBtn.appendChild(letterBadge);
        optionBtn.appendChild(optionTextNode);
        
        // Attach click handler
        optionBtn.addEventListener("click", () => selectOption(idx));
        
        optionsGrid.appendChild(optionBtn);
    });
    
    // Update Header HUD (Progress, active count)
    updateHeaderHUD();
    
    // Navigation Buttons configuration
    btnPrev.disabled = index === 0;
    
    // Prevent skipping: Enable Next only if answer is already saved for this question
    const hasAnswered = userAnswers[index] !== null;
    btnNext.disabled = !hasAnswered;
    
    // If it's the last question, label the Next button as Finish
    if (index === questions.length - 1) {
        btnNext.innerHTML = `Finish 
            <svg viewBox="0 0 24 24" width="20" height="20" style="margin-left: 4px; vertical-align: middle;">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>`;
    } else {
        btnNext.innerHTML = `Next 
            <svg viewBox="0 0 24 24" width="20" height="20" style="margin-left: 4px; vertical-align: middle;">
                <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>`;
    }
}

/**
 * Handles the selection of an option card
 * @param {number} optionIdx - Index of selected option (0-3)
 */
function selectOption(optionIdx) {
    userAnswers[currentIndex] = optionIdx;
    
    // Toggle active classes in Grid
    const buttons = optionsGrid.querySelectorAll(".option-btn");
    buttons.forEach((btn, idx) => {
        if (idx === optionIdx) {
            btn.classList.add("selected");
        } else {
            btn.classList.remove("selected");
        }
    });
    
    // Enable next navigation
    btnNext.disabled = false;
    
    // Animate mascot jump-spin to celebrate selection feedback
    mascotGraphic.classList.add("spin-active");
    setTimeout(() => {
        mascotGraphic.classList.remove("spin-active");
    }, 700);

    // Update XP score counter based on completed questions count
    updateHeaderHUD();
}

/**
 * Updates progress bars, question text tracker, and point counters in header
 */
function updateHeaderHUD() {
    if (questions.length === 0) return;
    
    // Progress calculation based on index
    const progressPercent = ((currentIndex + 1) / questions.length) * 100;
    progressBar.style.width = `${progressPercent}%`;
    progressText.textContent = `${currentIndex + 1}/${questions.length}`;
    
    // Score counts how many questions have been answered. Each answered question gives 10 XP.
    const answeredCount = userAnswers.filter(ans => ans !== null).length;
    scoreCounter.textContent = answeredCount * 10;
}

/**
 * Changes mascot bubble speech content with a subtle bounce animation
 * @param {string} key - Category key or check point key
 */
function updateMascotSpeech(key) {
    const text = mascotPrompts[key] || mascotPrompts["WELCOME"];
    mascotBubble.textContent = text;
    
    // Trigger pop bounce on speech bubble
    const bubble = document.querySelector(".speech-bubble");
    if (bubble) {
        bubble.classList.remove("shake");
        // Force reflow to restart CSS animations
        void bubble.offsetWidth;
        bubble.style.animation = "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards";
    }

    // Trigger Bujji speaking nod animation
    mascotGraphic.classList.add("speaking-active");
    setTimeout(() => {
        mascotGraphic.classList.remove("speaking-active");
    }, 1000);
}

/**
 * Navigates to the next question or completes the quiz
 */
function handleNext() {
    if (userAnswers[currentIndex] === null) return; // Prevent skipping
    
    if (currentIndex < questions.length - 1) {
        currentIndex++;
        loadQuestion(currentIndex);
    } else {
        submitQuiz();
    }
}

/**
 * Navigates to the previous question
 */
function handlePrev() {
    if (currentIndex > 0) {
        currentIndex--;
        loadQuestion(currentIndex);
    }
}

/**
 * Submits user selections to the server, updates tables, and displays results.
 */
async function submitQuiz() {
    // Show loading text on finish button to prevent double-clicks
    btnNext.disabled = true;
    btnNext.textContent = "Grading...";
    
    try {
        const response = await fetch(SUBMIT_QUIZ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ answers: userAnswers })
        });
        
        if (!response.ok) {
            throw new Error("Failed to submit quiz results.");
        }
        
        const result = await response.json();
        
        // Hide active quiz panels
        quizWorkspace.classList.add("hidden");
        document.getElementById("app-footer").classList.add("hidden");
        resultsContainer.classList.remove("hidden");
        
        const hasPassed = result.status === 'passed';
        
        // Render Stats
        statTotal.textContent = result.totalQuestions;
        statCorrect.textContent = result.correctCount;
        statWrong.textContent = result.wrongCount;
        
        // Render Circular Percentage Ring
        const radius = 40;
        const circumference = 2 * Math.PI * radius; // ~251.2
        const offset = circumference - (result.percentage / 100) * circumference;
        circularRing.style.strokeDasharray = `${circumference}`;
        circularRing.style.strokeDashoffset = `${offset}`;
        
        // Count up animation for percentage
        let currentPct = 0;
        const interval = setInterval(() => {
            if (currentPct >= result.percentage) {
                circularText.textContent = `${result.percentage}%`;
                clearInterval(interval);
            } else {
                currentPct++;
                circularText.textContent = `${currentPct}%`;
            }
        }, 15);
        
        // Level Unlock / Retry logic UI modifications
        if (hasPassed) {
            if (typeof BujjiSynth !== 'undefined') BujjiSynth.playSuccess();
            const level = typeof QUIZ_LEVEL !== 'undefined' ? QUIZ_LEVEL : 1;
            resultsTitle.textContent = "Congratulations!";
            resultsSubtitle.textContent = result.levelUnlocked ? `Level ${level + 1} Unlocked Successfully!` : "You have passed this level!";
            resultsSubtitle.style.color = "var(--color-primary-press)";
            
            resultBadgeContainer.classList.remove("hidden");
            unlockedBadge.style.backgroundColor = "var(--color-yellow)";
            unlockedBadge.innerHTML = `
                <div class="crown-glow"></div>
                <svg viewBox="0 0 24 24" width="48" height="48" fill="#FFFFFF">
                    <path d="M5 16L3 5L8.5 10L12 3L15.5 10L21 5L19 16H5ZM19 19c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1Z"/>
                </svg>
            `;
            
            // Success Mascot
            resultsMascotGraphic.innerHTML = `
                <defs>
                    <linearGradient id="metal-grad-success" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#FDE7B9"/>
                        <stop offset="50%" stop-color="#EBAD45"/>
                        <stop offset="100%" stop-color="#9C7026"/>
                    </linearGradient>
                    <filter id="neon-glow-success" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <ellipse cx="100" cy="180" rx="60" ry="10" fill="#E2E8F0"/>
                <path d="M70 140 L130 140 L120 170 L80 170 Z" fill="#5E400B" />
                <rect x="75" y="165" width="50" height="10" rx="5" fill="#EBAD45" />
                <circle cx="100" cy="100" r="65" fill="url(#metal-grad-success)" stroke="#5E400B" stroke-width="4" />
                <path d="M35 100 L165 100" stroke="#5E400B" stroke-width="3" />
                <path d="M37 92 C 50 85, 150 85, 163 92 L161 115 C 150 122, 50 122, 39 115 Z" fill="#0D1117" stroke="#5E400B" stroke-width="2" />
                <path d="M52,106 Q68,96 84,106" stroke="#61D3D5" stroke-width="8" stroke-linecap="round" fill="none" filter="url(#neon-glow-success)" />
                <path d="M116,106 Q132,96 148,106" stroke="#61D3D5" stroke-width="8" stroke-linecap="round" fill="none" filter="url(#neon-glow-success)" />
                <circle cx="100" cy="65" r="7" fill="#5E400B" />
                <circle cx="100" cy="65" r="4" fill="#FFC800" filter="url(#neon-glow-success)" />
                <rect x="27" y="90" width="8" height="20" rx="3" fill="#EBAD45" stroke="#5E400B" stroke-width="2" />
                <rect x="165" y="90" width="8" height="20" rx="3" fill="#EBAD45" stroke="#5E400B" stroke-width="2" />
            `;
            
            btnResultAction.textContent = "Back to Dashboard";
            btnResultAction.className = "btn-primary ripple-btn";
            btnResultAction.onclick = () => {
                window.location.href = DASHBOARD_URL;
            };
        } else {
            if (typeof BujjiSynth !== 'undefined') BujjiSynth.playFailure();
            resultsTitle.textContent = "Keep Practicing!";
            resultsSubtitle.textContent = "You need 70% or higher to unlock the next level.";
            resultsSubtitle.style.color = "var(--color-red)";
            
            resultBadgeContainer.classList.remove("hidden");
            unlockedBadge.style.backgroundColor = "#AFAFAF";
            unlockedBadge.style.boxShadow = "0 6px 0 0 #888888";
            unlockedBadge.innerHTML = `
                <svg viewBox="0 0 24 24" width="48" height="48" fill="#FFFFFF">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
            `;
            
            // Sad Mascot
            resultsMascotGraphic.innerHTML = `
                <defs>
                    <linearGradient id="metal-grad-fail" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#FDE7B9"/>
                        <stop offset="50%" stop-color="#EBAD45"/>
                        <stop offset="100%" stop-color="#9C7026"/>
                    </linearGradient>
                    <filter id="neon-glow-fail" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <ellipse cx="100" cy="180" rx="60" ry="10" fill="#E2E8F0"/>
                <path d="M70 140 L130 140 L120 170 L80 170 Z" fill="#5E400B" />
                <rect x="75" y="165" width="50" height="10" rx="5" fill="#EBAD45" />
                <circle cx="100" cy="100" r="65" fill="url(#metal-grad-fail)" stroke="#5E400B" stroke-width="4" />
                <path d="M35 100 L165 100" stroke="#5E400B" stroke-width="3" />
                <path d="M37 92 C 50 85, 150 85, 163 92 L161 115 C 150 122, 50 122, 39 115 Z" fill="#0D1117" stroke="#5E400B" stroke-width="2" />
                <path d="M52,100 Q68,110 84,100" stroke="#FD847E" stroke-width="8" stroke-linecap="round" fill="none" filter="url(#neon-glow-fail)" />
                <path d="M116,100 Q132,110 148,100" stroke="#FD847E" stroke-width="8" stroke-linecap="round" fill="none" filter="url(#neon-glow-fail)" />
                <circle cx="100" cy="65" r="7" fill="#5E400B" />
                <circle cx="100" cy="65" r="4" fill="#FD847E" />
                <rect x="27" y="90" width="8" height="20" rx="3" fill="#EBAD45" stroke="#5E400B" stroke-width="2" />
                <rect x="165" y="90" width="8" height="20" rx="3" fill="#EBAD45" stroke="#5E400B" stroke-width="2" />
            `;
            
            const level = typeof QUIZ_LEVEL !== 'undefined' ? QUIZ_LEVEL : 1;
            btnResultAction.textContent = `Retry Level ${level}`;
            btnResultAction.className = "btn-secondary";
            btnResultAction.onclick = () => {
                window.location.reload();
            };
        }
        
        // Render Review List based on actual correct answers graded on the backend
        renderReviewBreakdown(result.correctAnswers);
        
    } catch (error) {
        console.error(error);
        alert("An error occurred while submitting your quiz. Please try again.");
        btnNext.disabled = false;
        btnNext.textContent = "Finish";
    }
}

/**
 * Builds the review breakdown card list dynamically using backend-provided correct indices
 * @param {Array} correctAnswers - Array of correct answer indices from the DB
 */
function renderReviewBreakdown(correctAnswers) {
    reviewList.innerHTML = "";
    
    questions.forEach((q, idx) => {
        const userSelection = userAnswers[idx];
        const correctAnswerIdx = correctAnswers[idx];
        const isCorrect = userSelection === correctAnswerIdx;
        
        const item = document.createElement("div");
        item.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;
        
        // Build Status Icon SVG
        const statusIcon = document.createElement("div");
        statusIcon.className = "review-status-icon";
        if (isCorrect) {
            statusIcon.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
            `;
        } else {
            statusIcon.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            `;
        }
        
        // Details Wrapper
        const details = document.createElement("div");
        details.className = "review-details";
        
        const cat = document.createElement("span");
        cat.className = "review-category";
        cat.textContent = `Question ${idx + 1} • ${q.category}`;
        
        const qText = document.createElement("p");
        qText.className = "review-question";
        qText.textContent = q.text;
        
        const ansWrapper = document.createElement("div");
        ansWrapper.className = "review-answers";
        
        // Show User Selected answer row
        const userRow = document.createElement("div");
        userRow.className = "review-ans-row selected";
        userRow.innerHTML = `
            <span class="review-ans-label">Your Answer:</span>
            <span class="review-ans-val">${q.options[userSelection]}</span>
        `;
        ansWrapper.appendChild(userRow);
        
        // If wrong, show correct answer row as well
        if (!isCorrect) {
            const correctRow = document.createElement("div");
            correctRow.className = "review-ans-row correct";
            correctRow.innerHTML = `
                <span class="review-ans-label">Correct Answer:</span>
                <span class="review-ans-val">${q.options[correctAnswerIdx]}</span>
            `;
            ansWrapper.appendChild(correctRow);
        }
        
        details.appendChild(cat);
        details.appendChild(qText);
        details.appendChild(ansWrapper);
        
        item.appendChild(statusIcon);
        item.appendChild(details);
        
        reviewList.appendChild(item);
    });
}

/**
 * Resets state and prompts double confirmation prior to exiting to dashboard
 */
function confirmClose() {
    const answeredCount = userAnswers.filter(ans => ans !== null).length;
    if (answeredCount > 0) {
        const confirmExit = confirm("Are you sure you want to exit? Your progress in this quiz session will be lost.");
        if (!confirmExit) return;
    }
    window.location.href = DASHBOARD_URL;
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================
btnNext.addEventListener("click", handleNext);
btnPrev.addEventListener("click", handlePrev);
btnClose.addEventListener("click", confirmClose);

// Initialize Quiz on DOM Content Loaded
document.addEventListener("DOMContentLoaded", initQuiz);
