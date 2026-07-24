/**
 * ============================================================================
 * PRODUCTION-GRADE AI SPEAKING EVALUATION ENGINE
 * ============================================================================
 * Inspired by ELSA Speak, Duolingo English Test, and Speak AI.
 * Performs Needleman-Wunsch / Levenshtein sequence token alignment,
 * multi-dimensional speech scoring (Accuracy, Speech Clarity, Fluency, 
 * Completeness, Confidence), CEFR & IELTS Speaking Band projections,
 * and high-grade SaaS UI analytics dashboard rendering.
 */

window.SpeakingEvaluationEngine = (function() {
    'use strict';

    // List of common English speech hesitation fillers
    const FILLER_WORDS = new Set(['uh', 'um', 'er', 'ah', 'aah', 'hmm', 'mmm', 'like', 'you know']);

    /**
     * Clean and normalize a string token for comparison
     */
    function cleanToken(str) {
        if (!str) return '';
        return str.toLowerCase().replace(/[^a-z0-9']/g, '').trim();
    }

    /**
     * Compute Levenshtein Edit Distance between two strings
     */
    function stringDistance(s1, s2) {
        const str1 = cleanToken(s1);
        const str2 = cleanToken(s2);
        if (str1 === str2) return 0;
        if (!str1.length) return str2.length;
        if (!str2.length) return str1.length;

        const dp = Array(str1.length + 1).fill(null).map(() => Array(str2.length + 1).fill(0));

        for (let i = 0; i <= str1.length; i++) dp[i][0] = i;
        for (let j = 0; j <= str2.length; j++) dp[0][j] = j;

        for (let i = 1; i <= str1.length; i++) {
            for (let j = 1; j <= str2.length; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,      // deletion
                    dp[i][j - 1] + 1,      // insertion
                    dp[i - 1][j - 1] + cost // substitution
                );
            }
        }
        return dp[str1.length][str2.length];
    }

    /**
     * Character Similarity (0.0 to 1.0)
     */
    function charSimilarity(s1, s2) {
        const c1 = cleanToken(s1);
        const c2 = cleanToken(s2);
        if (!c1 && !c2) return 1.0;
        if (!c1 || !c2) return 0.0;
        const dist = stringDistance(c1, c2);
        const maxLen = Math.max(c1.length, c2.length);
        return Math.max(0, 1 - dist / maxLen);
    }

    /**
     * Token Sequence Alignment (Needleman-Wunsch Dynamic Programming)
     */
    function alignTokens(promptText, spokenText) {
        const promptRaw = promptText ? promptText.split(/\s+/).filter(Boolean) : [];
        const spokenRaw = spokenText ? spokenText.split(/\s+/).filter(Boolean) : [];

        const pTokens = promptRaw.map(cleanToken);
        const sTokens = spokenRaw.map(cleanToken);

        const m = pTokens.length;
        const n = sTokens.length;

        // DP matrix for alignment
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i * 1.5;
        for (let j = 0; j <= n; j++) dp[0][j] = j * 1.0;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const isMatch = pTokens[i - 1] === sTokens[j - 1];
                const sim = charSimilarity(pTokens[i - 1], sTokens[j - 1]);
                
                let matchCost = 0;
                if (isMatch) {
                    matchCost = 0;
                } else if (sim >= 0.7) {
                    matchCost = 0.4;
                } else {
                    matchCost = 1.8;
                }

                dp[i][j] = Math.min(
                    dp[i - 1][j - 1] + matchCost, // Match or Substitution
                    dp[i - 1][j] + 1.2,           // Deletion (Missing prompt word)
                    dp[i][j - 1] + 1.0            // Insertion (Extra spoken word)
                );
            }
        }

        // Traceback to build alignment sequence
        let i = m;
        let j = n;
        const alignedSteps = [];

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0) {
                const isMatch = pTokens[i - 1] === sTokens[j - 1];
                const sim = charSimilarity(pTokens[i - 1], sTokens[j - 1]);
                let matchCost = isMatch ? 0 : (sim >= 0.7 ? 0.4 : 1.8);

                if (Math.abs(dp[i][j] - (dp[i - 1][j - 1] + matchCost)) < 0.01) {
                    if (isMatch) {
                        alignedSteps.unshift({ type: 'CORRECT', word: spokenRaw[j - 1], promptWord: promptRaw[i - 1], score: 1.0 });
                    } else if (sim >= 0.7) {
                        alignedSteps.unshift({ type: 'CORRECT', word: spokenRaw[j - 1], promptWord: promptRaw[i - 1], score: sim });
                    } else {
                        alignedSteps.unshift({ type: 'INCORRECT', word: spokenRaw[j - 1], promptWord: promptRaw[i - 1], score: sim });
                    }
                    i--;
                    j--;
                    continue;
                }
            }

            if (j > 0 && Math.abs(dp[i][j] - (dp[i][j - 1] + 1.0)) < 0.01) {
                const wordClean = sTokens[j - 1];
                const isFiller = FILLER_WORDS.has(wordClean);
                alignedSteps.unshift({ type: isFiller ? 'FILLER' : 'EXTRA', word: spokenRaw[j - 1], promptWord: null, score: 0 });
                j--;
                continue;
            }

            if (i > 0) {
                alignedSteps.unshift({ type: 'MISSING', word: null, promptWord: promptRaw[i - 1], score: 0 });
                i--;
            }
        }

        return {
            promptWords: promptRaw,
            spokenWords: spokenRaw,
            steps: alignedSteps
        };
    }

    /**
     * Evaluate Speaking Performance Metrics
     */
    function evaluateSpeech(promptText, spokenText, durationSecs) {
        const duration = Math.max(1, durationSecs || 1);
        const alignment = alignTokens(promptText, spokenText);
        const steps = alignment.steps;

        let correctCount = 0;
        let incorrectCount = 0;
        let missingCount = 0;
        let extraCount = 0;
        let fillerCount = 0;

        steps.forEach(s => {
            if (s.type === 'CORRECT') correctCount++;
            else if (s.type === 'INCORRECT') incorrectCount++;
            else if (s.type === 'MISSING') missingCount++;
            else if (s.type === 'EXTRA') extraCount++;
            else if (s.type === 'FILLER') fillerCount++;
        });

        const totalPromptWords = alignment.promptWords.length || 1;
        const totalSpokenWords = alignment.spokenWords.length || 0;

        // 1. Accuracy Score (0-100) based on WER token alignment
        const werErrors = incorrectCount + missingCount + (extraCount * 0.5);
        const accuracyRaw = Math.max(0, 100 - (werErrors / totalPromptWords) * 100);
        const accuracy = Math.min(100, Math.round(accuracyRaw));

        // 2. Speech Clarity Score (0-100) based on character similarity & sequence match
        let clarityBase = 0;
        if (totalSpokenWords > 0) {
            const sumSim = steps.reduce((acc, curr) => acc + (curr.score || 0), 0);
            clarityBase = (sumSim / Math.max(1, steps.length)) * 100;
        }
        const speechClarity = Math.min(100, Math.max(0, Math.round((clarityBase * 0.7) + (accuracy * 0.3))));

        // 3. Fluency Score (0-100) based on WPM, cadence & filler penalty
        const wpm = Math.round((totalSpokenWords / duration) * 60);
        
        // Target WPM range: 110 - 160 WPM (Ideal = 135 WPM)
        let wpmScore = 100;
        if (wpm < 110) {
            wpmScore = Math.max(20, Math.round((wpm / 110) * 100));
        } else if (wpm > 170) {
            wpmScore = Math.max(50, 100 - Math.round(((wpm - 170) / 100) * 40));
        }

        // Penalize fillers (-4% per filler word)
        const fillerPenalty = fillerCount * 4;
        const fluencyRaw = (wpmScore * 0.6) + (accuracy * 0.4) - fillerPenalty;
        const fluency = Math.min(100, Math.max(0, Math.round(fluencyRaw)));

        // 4. Completeness Score (0-100)
        const completeness = Math.min(100, Math.round((correctCount / totalPromptWords) * 100));

        // 5. Speaking Confidence Score (0-100)
        const confidencePenalty = (fillerCount * 5) + (extraCount * 2) + (missingCount * 3);
        const confidence = Math.min(100, Math.max(10, Math.round(((fluency + accuracy) / 2) - confidencePenalty)));

        // 6. Composite Overall Score (Weighted)
        const overallScore = Math.round(
            (accuracy * 0.40) +
            (speechClarity * 0.25) +
            (fluency * 0.20) +
            (completeness * 0.10) +
            (confidence * 0.05)
        );

        // 7. Overall Grade Assignment
        let grade = 'F';
        if (overallScore >= 95) grade = 'A+';
        else if (overallScore >= 90) grade = 'A';
        else if (overallScore >= 85) grade = 'B+';
        else if (overallScore >= 80) grade = 'B';
        else if (overallScore >= 70) grade = 'C';
        else if (overallScore >= 60) grade = 'D';
        else grade = 'Needs Practice';

        // 8. International CEFR & IELTS Standards Projection
        let cefr = 'A1 Beginner';
        let ielts = 'Band 3.5 - 4.0';

        if (overallScore >= 95) {
            cefr = 'C2 Mastery';
            ielts = 'Band 8.5 - 9.0';
        } else if (overallScore >= 90) {
            cefr = 'C1 Advanced';
            ielts = 'Band 7.5 - 8.0';
        } else if (overallScore >= 85) {
            cefr = 'B2 Upper-Intermediate';
            ielts = 'Band 6.5 - 7.0';
        } else if (overallScore >= 80) {
            cefr = 'B1+ Intermediate';
            ielts = 'Band 6.0';
        } else if (overallScore >= 70) {
            cefr = 'B1 Intermediate';
            ielts = 'Band 5.0 - 5.5';
        } else if (overallScore >= 60) {
            cefr = 'A2 Elementary';
            ielts = 'Band 4.0 - 4.5';
        }

        return {
            overallScore,
            grade,
            cefr,
            ielts,
            metrics: {
                accuracy,
                speechClarity,
                fluency,
                completeness,
                confidence,
                wpm,
                duration,
                totalSpokenWords,
                correctCount,
                incorrectCount,
                missingCount,
                extraCount,
                fillerCount
            },
            alignment
        };
    }

    /**
     * Render Modern Vercel / Linear Level SaaS Evaluation Dashboard
     */
    function renderSaaSReport(result, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const m = result.metrics;
        const steps = result.alignment.steps;

        // Build word error pills with tooltips
        let wordPillsHtml = '';
        if (steps.length === 0) {
            wordPillsHtml = `<span style="color:#94A3B8; font-style:italic;">No speech submitted. Please try again.</span>`;
        } else {
            steps.forEach(step => {
                let bg = '#DCFCE7';
                let color = '#166534';
                let border = '#BBF7D0';
                let label = step.word || step.promptWord;
                let tooltip = 'Correctly spoken';

                if (step.type === 'CORRECT') {
                    bg = '#DCFCE7'; color = '#166534'; border = '#86EFAC';
                    tooltip = 'Correct pronunciation & word choice';
                } else if (step.type === 'INCORRECT') {
                    bg = '#FEE2E2'; color = '#991B1B'; border = '#FCA5A5';
                    label = step.word;
                    tooltip = `Mispronounced or substituted (Expected: "${step.promptWord}")`;
                } else if (step.type === 'MISSING') {
                    bg = '#FFEDD5'; color = '#C2410C'; border = '#FDBA74';
                    label = `[missing: ${step.promptWord}]`;
                    tooltip = `Word omitted from prompt`;
                } else if (step.type === 'EXTRA') {
                    bg = '#DBEAFE'; color = '#1E40AF'; border = '#93C5FD';
                    label = `[extra: ${step.word}]`;
                    tooltip = `Unnecessary word inserted`;
                } else if (step.type === 'FILLER') {
                    bg = '#F3E8FF'; color = '#6B21A8'; border = '#D8B4FE';
                    label = `[filler: ${step.word}]`;
                    tooltip = `Hesitation filler word`;
                }

                wordPillsHtml += `
                    <span title="${tooltip}" style="display:inline-block; padding:4px 10px; margin:3px; border-radius:8px; font-weight:700; font-size:13.5px; background:${bg}; color:${color}; border:1px solid ${border}; cursor:pointer; transition:transform 0.15s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        ${label}
                    </span>
                `;
            });
        }

        // SVG Ring Color for Overall Score
        let gradeColor = '#2563EB';
        if (result.overallScore >= 90) gradeColor = '#059669';
        else if (result.overallScore >= 80) gradeColor = '#2563EB';
        else if (result.overallScore >= 70) gradeColor = '#D97706';
        else gradeColor = '#DC2626';

        const strokeDashOffset = 283 - (283 * result.overallScore) / 100;

        container.style.display = 'block';
        container.innerHTML = `
            <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:24px; box-shadow:0 20px 40px rgba(0,0,0,0.06); overflow:hidden; text-align:left; max-width:680px; margin:24px auto 0 auto;">
                
                <!-- Dark Header Card with Grade & Standards -->
                <div style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding:28px 32px; color:#FFFFFF; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                            <span style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#60A5FA; background:rgba(59,130,246,0.15); padding:3px 10px; border-radius:12px;">
                                AI Speech Report
                            </span>
                            <span style="font-size:11px; font-weight:700; color:#94A3B8;">
                                Duration: ${m.duration}s • ${m.wpm} WPM
                            </span>
                        </div>
                        <h2 style="font-size:22px; font-weight:800; color:#FFFFFF; margin:0 0 4px 0;">Speaking Assessment</h2>
                        <div style="display:flex; gap:12px; font-size:12.5px; font-weight:700; color:#CBD5E1; margin-top:8px;">
                            <span style="background:rgba(255,255,255,0.08); padding:3px 10px; border-radius:8px;">CEFR: ${result.cefr}</span>
                            <span style="background:rgba(255,255,255,0.08); padding:3px 10px; border-radius:8px;">IELTS: ${result.ielts}</span>
                        </div>
                    </div>

                    <!-- Animated Overall Score Ring -->
                    <div style="position:relative; width:90px; height:90px; display:flex; align-items:center; justify-content:center;">
                        <svg width="90" height="90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
                            <circle cx="50" cy="50" r="45" fill="none" stroke="${gradeColor}" stroke-width="8" stroke-dasharray="283" stroke-dashoffset="${strokeDashOffset}" stroke-linecap="round" transform="rotate(-90 50 50)" style="transition: stroke-dashoffset 1s ease-in-out;"/>
                        </svg>
                        <div style="position:absolute; text-align:center;">
                            <div style="font-size:22px; font-weight:900; color:#FFFFFF; line-height:1;">${result.grade}</div>
                            <div style="font-size:11px; font-weight:700; color:#94A3B8;">${result.overallScore}%</div>
                        </div>
                    </div>
                </div>

                <!-- Word-by-Word Sequence Breakdown -->
                <div style="padding:24px 32px; border-bottom:1px solid #F1F5F9;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <h4 style="font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#64748B; margin:0;">
                            Transcript & Word Analysis
                        </h4>
                        <div style="display:flex; gap:12px; font-size:11px; font-weight:700;">
                            <span style="color:#166534;">● Correct</span>
                            <span style="color:#991B1B;">● Mispronounced</span>
                            <span style="color:#C2410C;">● Missing</span>
                            <span style="color:#1E40AF;">● Extra</span>
                        </div>
                    </div>
                    <div style="line-height:2.2;">
                        ${wordPillsHtml}
                    </div>
                </div>

                <!-- 5 Metrics Grid -->
                <div style="padding:24px 32px; background:#F8FAFC; border-bottom:1px solid #F1F5F9;">
                    <h4 style="font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#64748B; margin:0 0 16px 0;">
                        Performance Metrics Breakdown
                    </h4>
                    <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:12px;">
                        <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:14px 10px; text-align:center;">
                            <div style="font-size:18px; font-weight:900; color:#2563EB;">${m.accuracy}%</div>
                            <div style="font-size:11px; font-weight:700; color:#64748B; margin-top:2px;">Accuracy</div>
                        </div>
                        <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:14px 10px; text-align:center;">
                            <div style="font-size:18px; font-weight:900; color:#059669;">${m.speechClarity}%</div>
                            <div style="font-size:11px; font-weight:700; color:#64748B; margin-top:2px;">Clarity</div>
                        </div>
                        <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:14px 10px; text-align:center;">
                            <div style="font-size:18px; font-weight:900; color:#D97706;">${m.fluency}%</div>
                            <div style="font-size:11px; font-weight:700; color:#64748B; margin-top:2px;">Fluency</div>
                        </div>
                        <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:14px 10px; text-align:center;">
                            <div style="font-size:18px; font-weight:900; color:#7C3AED;">${m.completeness}%</div>
                            <div style="font-size:11px; font-weight:700; color:#64748B; margin-top:2px;">Complete</div>
                        </div>
                        <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:14px 10px; text-align:center;">
                            <div style="font-size:18px; font-weight:900; color:#0891B2;">${m.confidence}%</div>
                            <div style="font-size:11px; font-weight:700; color:#64748B; margin-top:2px;">Confidence</div>
                        </div>
                    </div>
                </div>

                <!-- Detailed Analytics Counters Bar -->
                <div style="padding:16px 32px; background:#FFFFFF; display:flex; justify-content:space-between; font-size:12px; font-weight:700; color:#64748B;">
                    <span>Words: <strong style="color:#0F172A;">${m.totalSpokenWords}</strong></span>
                    <span>Matched: <strong style="color:#16A34A;">${m.correctCount}</strong></span>
                    <span>Missing: <strong style="color:#C2410C;">${m.missingCount}</strong></span>
                    <span>Extra: <strong style="color:#2563EB;">${m.extraCount}</strong></span>
                    <span>Fillers: <strong style="color:#7C3AED;">${m.fillerCount}</strong></span>
                </div>
            </div>
        `;
    }

    return {
        evaluateSpeech,
        renderSaaSReport
    };
})();
