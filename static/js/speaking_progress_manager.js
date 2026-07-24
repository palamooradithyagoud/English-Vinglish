/**
 * SpeakingProgressManager — Persistent Level Progress, Attempt History & XP Claim Manager
 * Designed for English Winglish SaaS Speaking Module Platform
 */
class SpeakingProgressManager {
    static getKey(catId, modIdx, lvlIdx) {
        return `speaking_record_${catId}_m${modIdx + 1}_l${lvlIdx + 1}`;
    }

    /**
     * Get level record object for a specific category, module, and level
     */
    static getLevelRecord(catId, modIdx, lvlIdx) {
        const key = this.getKey(catId, modIdx, lvlIdx);
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.error('Error reading level record:', e);
        }

        // Return clean default level record structure
        return {
            levelKey: key,
            catId: catId,
            modIdx: modIdx,
            lvlIdx: lvlIdx,
            completed: false,
            xpClaimed: false,
            xpEarned: 0,
            unlocked: (modIdx === 0 && lvlIdx === 0), // Level 1.1 unlocked by default
            attemptCount: 0,
            completedAt: null,
            bestScore: 0,
            latestScore: 0,
            bestAttempt: null,
            latestAttempt: null,
            attempts: []
        };
    }

    /**
     * Save a fresh practice attempt (Updates attemptCount, latestAttempt, bestScore, attempts[])
     */
    static saveAttempt(catId, modIdx, lvlIdx, evalResult, spokenText, durationSecs) {
        const record = this.getLevelRecord(catId, modIdx, lvlIdx);
        const attemptScore = evalResult && evalResult.metrics ? evalResult.metrics.overallScore : (evalResult && evalResult.accuracy ? evalResult.accuracy : 0);
        
        const attemptObj = {
            attemptId: Date.now(),
            timestamp: new Date().toISOString(),
            spokenText: spokenText || '',
            durationSecs: durationSecs || 0,
            score: attemptScore,
            metrics: evalResult ? evalResult.metrics || evalResult : {},
            breakdown: evalResult ? evalResult.alignedTokens || [] : [],
            grade: evalResult ? evalResult.grade || 'C' : 'C',
            cefr: evalResult ? evalResult.cefr || 'B1 Intermediate' : 'B1 Intermediate',
            ielts: evalResult ? evalResult.ielts || 'Band 5.5' : 'Band 5.5'
        };

        record.attemptCount = (record.attemptCount || 0) + 1;
        record.latestAttempt = attemptObj;
        record.latestScore = attemptScore;

        if (!record.bestScore || attemptScore >= record.bestScore) {
            record.bestScore = attemptScore;
            record.bestAttempt = attemptObj;
        }

        if (!record.attempts) record.attempts = [];
        record.attempts.push(attemptObj);

        // Save updated record to localStorage
        const key = this.getKey(catId, modIdx, lvlIdx);
        localStorage.setItem(key, JSON.stringify(record));

        // Legacy compatibility keys for existing roadmap path renders
        const legacyScoreKey = `speaking_score_${catId}_mod_${modIdx + 1}_lvl_${lvlIdx + 1}`;
        localStorage.setItem(legacyScoreKey, JSON.stringify({
            completed: record.completed,
            accuracy: record.bestScore,
            score: record.bestScore,
            completedAt: record.completedAt || new Date().toISOString()
        }));

        return record;
    }

    /**
     * Claim XP for a level (Executes once per level)
     */
    static claimLevelXP(catId, modIdx, lvlIdx, xpAmount) {
        const record = this.getLevelRecord(catId, modIdx, lvlIdx);

        if (!record.xpClaimed) {
            record.completed = true;
            record.xpClaimed = true;
            record.xpEarned = xpAmount;
            if (!record.completedAt) {
                record.completedAt = new Date().toISOString();
            }

            const key = this.getKey(catId, modIdx, lvlIdx);
            localStorage.setItem(key, JSON.stringify(record));

            // Legacy compatibility flags
            const legacyClaimedKey = `speaking_claimed_${catId}_mod_${modIdx + 1}_lvl_${lvlIdx + 1}`;
            localStorage.setItem(legacyClaimedKey, 'true');

            // Unlock next level in localStorage
            const progressKey = `speaking_levels_${catId}_mod_${modIdx + 1}`;
            const currentUnlocked = parseInt(localStorage.getItem(progressKey) || '1');
            const nextLevelNum = lvlIdx + 2;

            if (nextLevelNum > currentUnlocked) {
                localStorage.setItem(progressKey, String(nextLevelNum));
            }

            // Unlock next module if level 1.10 finished
            if (nextLevelNum > 10) {
                const modProgressKey = `speaking_modules_${catId}`;
                const unlockedModules = parseInt(localStorage.getItem(modProgressKey) || '1');
                if (modIdx + 2 > unlockedModules) {
                    localStorage.setItem(modProgressKey, String(modIdx + 2));
                }
            }
        }

        return record;
    }

    /**
     * Check if a level is already completed and claimed
     */
    static isLevelClaimed(catId, modIdx, lvlIdx) {
        const record = this.getLevelRecord(catId, modIdx, lvlIdx);
        return Boolean(record.xpClaimed);
    }
}

// Attach to window object for global availability
window.SpeakingProgressManager = SpeakingProgressManager;
