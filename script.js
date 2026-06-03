/**
 * Level 1 - English Basics
 * English Learning Platform JavaScript Controller
 * 
 * Manages quiz state, question rendering, user inputs, score calculation, 
 * UI transitions, and final performance reports.
 */

// ==========================================================================
// QUESTION DATASET (20 Questions - 5 Categories)
// ==========================================================================
const questions = [
    // Category 1: Vocabulary (Questions 1-4)
    {
        id: 1,
        category: "VOCABULARY",
        text: "Choose the correct meaning of the word 'ephemeral'.",
        options: [
            "Long-lasting and durable",
            "Short-lived or lasting for a very short time",
            "Extremely strong and powerful",
            "Highly intellectual or academic"
        ],
        correctAnswer: 1
    },
    {
        id: 2,
        category: "VOCABULARY",
        text: "A person who is quiet and reserves their thoughts or feelings is described as:",
        options: [
            "Loquacious",
            "Reticent",
            "Gregarious",
            "Audacious"
        ],
        correctAnswer: 1
    },
    {
        id: 3,
        category: "VOCABULARY",
        text: "Someone who actively supports or speaks in favor of a cause or policy is an:",
        options: [
            "Adversary",
            "Advocate",
            "Accomplice",
            "Apprentice"
        ],
        correctAnswer: 1
    },
    {
        id: 4,
        category: "VOCABULARY",
        text: "What is the meaning of the word 'meticulous'?",
        options: [
            "Showing great attention to detail; very precise",
            "Careless, messy, and disorganized in work",
            "Extremely fast-paced and energetic",
            "Lacking energy, interest, or motivation"
        ],
        correctAnswer: 0
    },

    // Category 2: Synonyms (Questions 5-8)
    {
        id: 5,
        category: "SYNONYMS",
        text: "What is a synonym for 'candid'?",
        options: [
            "Deceptive",
            "Honest",
            "Reluctant",
            "Silent"
        ],
        correctAnswer: 1
    },
    {
        id: 6,
        category: "SYNONYMS",
        text: "Identify the synonym of the word 'mitigate'.",
        options: [
            "Aggravate",
            "Alleviate",
            "Originate",
            "Duplicate"
        ],
        correctAnswer: 1
    },
    {
        id: 7,
        category: "SYNONYMS",
        text: "Choose the synonym of 'pragmatic'.",
        options: [
            "Idealistic",
            "Practical",
            "Inefficient",
            "Impulsive"
        ],
        correctAnswer: 1
    },
    {
        id: 8,
        category: "SYNONYMS",
        text: "Find the synonym of 'superfluous'.",
        options: [
            "Essential",
            "Unnecessary",
            "Insufficient",
            "Temporary"
        ],
        correctAnswer: 1
    },

    // Category 3: Antonyms (Questions 9-12)
    {
        id: 9,
        category: "ANTONYMS",
        text: "What is the antonym of the word 'obstinate'?",
        options: [
            "Stubborn",
            "Flexible",
            "Hostile",
            "Rigid"
        ],
        correctAnswer: 1
    },
    {
        id: 10,
        category: "ANTONYMS",
        text: "Select the antonym of the word 'benevolent'.",
        options: [
            "Malevolent",
            "Generous",
            "Friendly",
            "Compassionate"
        ],
        correctAnswer: 0
    },
    {
        id: 11,
        category: "ANTONYMS",
        text: "Choose the antonym of 'scarcity'.",
        options: [
            "Famine",
            "Shortage",
            "Abundance",
            "Deficit"
        ],
        correctAnswer: 2
    },
    {
        id: 12,
        category: "ANTONYMS",
        text: "What is the antonym of the word 'timid'?",
        options: [
            "Shy",
            "Bold",
            "Cautious",
            "Humble"
        ],
        correctAnswer: 1
    },

    // Category 4: Articles (Questions 13-16)
    {
        id: 13,
        category: "ARTICLES",
        text: "Fill in the blank: She is _______ honorable person who always tells the truth.",
        options: [
            "a",
            "an",
            "the",
            "no article"
        ],
        correctAnswer: 1
    },
    {
        id: 14,
        category: "ARTICLES",
        text: "Fill in the blank: I saw _______ European tourist looking at the map.",
        options: [
            "a",
            "an",
            "the",
            "no article"
        ],
        correctAnswer: 0
    },
    {
        id: 15,
        category: "ARTICLES",
        text: "Fill in the blank: Mount Everest is _______ tallest peak in the world.",
        options: [
            "a",
            "an",
            "the",
            "no article"
        ],
        correctAnswer: 2
    },
    {
        id: 16,
        category: "ARTICLES",
        text: "Fill in the blank: He wants to learn how to play _______ violin.",
        options: [
            "a",
            "an",
            "the",
            "no article"
        ],
        correctAnswer: 2
    },

    // Category 5: Fill in the Blanks (Questions 17-20)
    {
        id: 17,
        category: "FILL IN THE BLANKS",
        text: "Fill in the blank: Despite the heavy storm, the ship reached the harbor _______.",
        options: [
            "safely",
            "safety",
            "safe",
            "safeness"
        ],
        correctAnswer: 0
    },
    {
        id: 18,
        category: "FILL IN THE BLANKS",
        text: "Fill in the blank: If she _______ harder, she would have passed the exam last semester.",
        options: [
            "studies",
            "will study",
            "had studied",
            "study"
        ],
        correctAnswer: 2
    },
    {
        id: 19,
        category: "FILL IN THE BLANKS",
        text: "Fill in the blank: The committee has not _______ reached a final decision.",
        options: [
            "yet",
            "already",
            "still",
            "since"
        ],
        correctAnswer: 0
    },
    {
        id: 20,
        category: "FILL IN THE BLANKS",
        text: "Fill in the blank: Neither the teacher nor the students _______ present at the meeting.",
        options: [
            "was",
            "were",
            "is",
            "are"
        ],
        correctAnswer: 1
    }
];

// Mascot Dialogue Prompts based on Categories
const mascotPrompts = {
    "WELCOME": "Bujji online. Level 1 quiz loaded. Ready to test English basics! Make your selection.",
    "VOCABULARY": "Analyzing vocabulary databases... Choose the option that defines this term correctly.",
    "SYNONYMS": "Scanning synonym registers. Identify the word with the equivalent semantic signature.",
    "ANTONYMS": "Antonyms represent binary opposites. Select the correct inverse word.",
    "ARTICLES": "Article logic unit active. Determine if 'a', 'an', or 't' fits the syntactic slot.",
    "FILL IN THE BLANKS": "Syntax analysis required. Please fill in the blank to complete the statement.",
    "MIDWAY": "Quiz progression: 50% complete. System temperature stable. Keep going, partner!",
    "ALMOST_DONE": "Quiz progression: 85% complete. Power reserves at maximum. Let's finish strong!",
    "PASS": "Level 1 cleared! Excellent performance. System authorization granted for Level 2!",
    "FAIL": "System Error: Score below 70%. Re-calibrating databases. Click Retry to run diagnostics again."
};

// ==========================================================================
// STATE VARIABLES
// ==========================================================================
let currentIndex = 0;
let userAnswers = new Array(questions.length).fill(null);

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
 * Initializes the application state and loads the first question
 */
function initQuiz() {
    currentIndex = 0;
    userAnswers.fill(null);
    
    // Hide results & show quiz panel
    resultsContainer.classList.add("hidden");
    quizWorkspace.classList.remove("hidden");
    document.getElementById("app-footer").classList.remove("hidden");
    
    updateMascotSpeech("WELCOME");
    loadQuestion(currentIndex);
}

/**
 * Renders a question onto the card based on the given index
 * @param {number} index - Index of the question to load
 */
function loadQuestion(index) {
    const question = questions[index];
    
    // Update question metadata
    categoryBadge.textContent = question.category;
    questionText.textContent = question.text;
    
    // Dynamic mascot response based on category & index checkpoints
    if (index === 10) {
        updateMascotSpeech("MIDWAY");
    } else if (index === 17) {
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
    
    // Animate mascot jump to celebrate selection feedback
    mascotGraphic.style.transform = "scale(1.1) translateY(-10px)";
    setTimeout(() => {
        mascotGraphic.style.transform = "scale(1) translateY(0)";
    }, 150);

    // Update XP score counter based on completed questions count
    updateHeaderHUD();
}

/**
 * Updates progress bars, question text tracker, and point counters in header
 */
function updateHeaderHUD() {
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
    bubble.classList.remove("shake");
    // Force reflow to restart CSS animations
    void bubble.offsetWidth;
    bubble.style.animation = "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards";
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
 * Evaluates performance metrics, triggers results layout, and locks/unlocks next level
 */
function submitQuiz() {
    // Hide active components
    quizWorkspace.classList.add("hidden");
    document.getElementById("app-footer").classList.add("hidden");
    resultsContainer.classList.remove("hidden");
    
    // Calculate details
    let correctCount = 0;
    questions.forEach((q, idx) => {
        if (userAnswers[idx] === q.correctAnswer) {
            correctCount++;
        }
    });
    
    const totalQuestions = questions.length;
    const wrongCount = totalQuestions - correctCount;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const hasPassed = percentage >= 70;
    
    // Render Stats
    statTotal.textContent = totalQuestions;
    statCorrect.textContent = correctCount;
    statWrong.textContent = wrongCount;
    
    // Render Circular Percentage Ring
    const radius = 40;
    const circumference = 2 * Math.PI * radius; // ~251.2
    const offset = circumference - (percentage / 100) * circumference;
    circularRing.style.strokeDasharray = `${circumference}`;
    circularRing.style.strokeDashoffset = `${offset}`;
    
    // Count up animation for percentage
    let currentPct = 0;
    const interval = setInterval(() => {
        if (currentPct >= percentage) {
            circularText.textContent = `${percentage}%`;
            clearInterval(interval);
        } else {
            currentPct++;
            circularText.textContent = `${currentPct}%`;
        }
    }, 15);
    
    // Level Unlock Logic & Aesthetic Theme Modification
    if (hasPassed) {
        // Passed styling
        resultsTitle.textContent = "Congratulations!";
        resultsSubtitle.textContent = "Level 2 Unlocked Successfully!";
        resultsSubtitle.style.color = "var(--color-primary-press)";
        
        // Show glowing golden crown badge
        resultBadgeContainer.classList.remove("hidden");
        unlockedBadge.style.backgroundColor = "var(--color-yellow)";
        unlockedBadge.innerHTML = `
            <div class="crown-glow"></div>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="#FFFFFF">
                <path d="M5 16L3 5L8.5 10L12 3L15.5 10L21 5L19 16H5ZM19 19c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1Z"/>
            </svg>
        `;
        
        // Set celebratory mascot svg properties
        resultsMascotGraphic.innerHTML = `
            <defs>
                <linearGradient id="metal-grad-success" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#4A5568"/>
                    <stop offset="50%" stop-color="#2D3748"/>
                    <stop offset="100%" stop-color="#1A202C"/>
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
            <path d="M70 140 L130 140 L120 170 L80 170 Z" fill="#1A202C" />
            <rect x="75" y="165" width="50" height="10" rx="5" fill="#4A5568" />
            <circle cx="100" cy="100" r="65" fill="url(#metal-grad-success)" stroke="#1A202C" stroke-width="4" />
            <path d="M35 100 L165 100" stroke="#1A202C" stroke-width="3" />
            <path d="M37 92 C 50 85, 150 85, 163 92 L161 115 C 150 122, 50 122, 39 115 Z" fill="#0D1117" stroke="#1A202C" stroke-width="2" />
            <!-- Happy glowing curved visor eyes -->
            <path d="M52,106 Q68,96 84,106" stroke="#81E6D9" stroke-width="8" stroke-linecap="round" fill="none" filter="url(#neon-glow-success)" />
            <path d="M116,106 Q132,96 148,106" stroke="#81E6D9" stroke-width="8" stroke-linecap="round" fill="none" filter="url(#neon-glow-success)" />
            <!-- Glowing celebratory forehead badge -->
            <circle cx="100" cy="65" r="7" fill="#1A202C" />
            <circle cx="100" cy="65" r="4" fill="#FFC800" filter="url(#neon-glow-success)" />
            <rect x="27" y="90" width="8" height="20" rx="3" fill="#4A5568" stroke="#1A202C" stroke-width="2" />
            <rect x="165" y="90" width="8" height="20" rx="3" fill="#4A5568" stroke="#1A202C" stroke-width="2" />
        `;
        
        btnResultAction.textContent = "Unlock Level 2";
        btnResultAction.className = "btn-primary ripple-btn";
        btnResultAction.onclick = () => {
            alert("Proceeding to Level 2 (Demo)! Well done!");
            initQuiz();
        };
    } else {
        // Failed styling
        resultsTitle.textContent = "Keep Practicing!";
        resultsSubtitle.textContent = "You need 70% or higher to unlock Level 2.";
        resultsSubtitle.style.color = "var(--color-red)";
        
        // Hide crown badge, or replace with grey lock
        resultBadgeContainer.classList.remove("hidden");
        unlockedBadge.style.backgroundColor = "#AFAFAF";
        unlockedBadge.style.boxShadow = "0 6px 0 0 #888888";
        unlockedBadge.innerHTML = `
            <svg viewBox="0 0 24 24" width="48" height="48" fill="#FFFFFF">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
        `;
        
        // Sad/Confused mascot
        resultsMascotGraphic.innerHTML = `
            <defs>
                <linearGradient id="metal-grad-fail" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#4A5568"/>
                    <stop offset="50%" stop-color="#2D3748"/>
                    <stop offset="100%" stop-color="#1A202C"/>
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
            <path d="M70 140 L130 140 L120 170 L80 170 Z" fill="#1A202C" />
            <rect x="75" y="165" width="50" height="10" rx="5" fill="#4A5568" />
            <circle cx="100" cy="100" r="65" fill="url(#metal-grad-fail)" stroke="#1A202C" stroke-width="4" />
            <path d="M35 100 L165 100" stroke="#1A202C" stroke-width="3" />
            <path d="M37 92 C 50 85, 150 85, 163 92 L161 115 C 150 122, 50 122, 39 115 Z" fill="#0D1117" stroke="#1A202C" stroke-width="2" />
            <!-- Worried/sad downward slanting glowing visor eyes (Orange/Red) -->
            <path d="M52,100 Q68,110 84,100" stroke="#FC8181" stroke-width="8" stroke-linecap="round" fill="none" filter="url(#neon-glow-fail)" />
            <path d="M116,100 Q132,110 148,100" stroke="#FC8181" stroke-width="8" stroke-linecap="round" fill="none" filter="url(#neon-glow-fail)" />
            <!-- Forehead indicator dim red -->
            <circle cx="100" cy="65" r="7" fill="#1A202C" />
            <circle cx="100" cy="65" r="4" fill="#E53E3E" />
            <rect x="27" y="90" width="8" height="20" rx="3" fill="#4A5568" stroke="#1A202C" stroke-width="2" />
            <rect x="165" y="90" width="8" height="20" rx="3" fill="#4A5568" stroke="#1A202C" stroke-width="2" />
        `;
        
        btnResultAction.textContent = "Retry Level 1";
        btnResultAction.className = "btn-secondary";
        btnResultAction.onclick = () => {
            initQuiz();
        };
    }
    
    // Render Review List (Question analysis)
    renderReviewBreakdown();
}

/**
 * Builds the review breakdown card list dynamically
 */
function renderReviewBreakdown() {
    reviewList.innerHTML = "";
    
    questions.forEach((q, idx) => {
        const userSelection = userAnswers[idx];
        const isCorrect = userSelection === q.correctAnswer;
        
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
        cat.textContent = `Question ${q.id} • ${q.category}`;
        
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
                <span class="review-ans-val">${q.options[q.correctAnswer]}</span>
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
 * Resets state and prompts double confirmation prior to exiting
 */
function confirmClose() {
    const confirmRestart = confirm("Are you sure you want to restart your quiz? Your progress will be lost.");
    if (confirmRestart) {
        initQuiz();
    }
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================
btnNext.addEventListener("click", handleNext);
btnPrev.addEventListener("click", handlePrev);
btnClose.addEventListener("click", confirmClose);

// Initialize Quiz on window load
window.addEventListener("DOMContentLoaded", initQuiz);
