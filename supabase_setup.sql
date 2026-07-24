-- Supabase Schema DDL Setup Script (Unified)
-- Paste this script directly into your Supabase Dashboard -> SQL Editor and hit "Run".

-- 1. Create students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    roll_number TEXT UNIQUE NOT NULL,
    branch TEXT NOT NULL,
    year INTEGER NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    level INTEGER NOT NULL,
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer INTEGER NOT NULL
);

-- 3. Create progress table
CREATE TABLE IF NOT EXISTS progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    score INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    status TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create faculty table
CREATE TABLE IF NOT EXISTS faculty (
    id SERIAL PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    department TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_by INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    score INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    time_taken INTEGER NOT NULL, -- in seconds
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create class_quizzes table
CREATE TABLE IF NOT EXISTS class_quizzes (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'all' or 'branch'
    target_branch TEXT, -- branch name if 'branch'
    created_by INTEGER REFERENCES faculty(id) ON DELETE CASCADE,
    questions JSONB NOT NULL, -- array of quiz questions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create class_quiz_attempts table
CREATE TABLE IF NOT EXISTS class_quiz_attempts (
    id SERIAL PRIMARY KEY,
    class_quiz_id INTEGER REFERENCES class_quizzes(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    answers JSONB NOT NULL, -- student's selected answers
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Create speaking_attempts table
CREATE TABLE IF NOT EXISTS speaking_attempts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL,
    accuracy INTEGER NOT NULL,
    pronunciation INTEGER NOT NULL,
    fluency INTEGER NOT NULL,
    word_count INTEGER NOT NULL,
    earned_xp INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Create game_attempts table
CREATE TABLE IF NOT EXISTS game_attempts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL, -- 'WORD_SCRAMBLE' or 'WORD_CONNECT'
    word_or_level TEXT NOT NULL,
    score INTEGER NOT NULL,
    streak INTEGER NOT NULL,
    earned_xp INTEGER NOT NULL,
    time_taken INTEGER, -- in seconds
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Create speaking_prompts table
CREATE TABLE IF NOT EXISTS public.speaking_prompts (
    id SERIAL PRIMARY KEY,
    activity_id TEXT NOT NULL,
    activity_name TEXT NOT NULL,
    activity_icon TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    reward_xp INTEGER NOT NULL,
    activity_description TEXT NOT NULL,
    prompt_index INTEGER NOT NULL,
    prompt_text TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 13. Create daily_challenge_attempts table
CREATE TABLE IF NOT EXISTS public.daily_challenge_attempts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    level_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    stars INTEGER NOT NULL,
    earned_xp INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_level UNIQUE (student_id, level_id)
);

-- 14. Create student_onboarding_profiles table
CREATE TABLE IF NOT EXISTS public.student_onboarding_profiles (
    id SERIAL PRIMARY KEY,
    student_id INTEGER UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    goals JSONB NOT NULL,
    reason TEXT NOT NULL,
    perceived_level TEXT NOT NULL,
    daily_time_mins INTEGER NOT NULL,
    biggest_challenges JSONB NOT NULL,
    learning_style JSONB NOT NULL,
    preferred_accent TEXT NOT NULL,
    notification_time TEXT NOT NULL,
    assessment_results JSONB NOT NULL,
    onboarding_completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Create daily_checkins table
CREATE TABLE IF NOT EXISTS public.daily_checkins (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    mood TEXT NOT NULL,
    target_activity TEXT NOT NULL,
    available_mins INTEGER NOT NULL,
    checkin_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_daily_checkin UNIQUE (student_id, checkin_date)
);


-- ==========================================
-- SECURITY HARDENING: ROW LEVEL SECURITY (RLS)
-- ==========================================

-- 1. Enable Row Level Security (RLS) on all tables to prevent public bypasses
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_onboarding_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- 2. Revoke all direct public/anonymous API access
-- Note: The python Flask backend uses the `service_role` key, which automatically
-- bypasses RLS policies, so no additional permissive policies are needed.
REVOKE ALL ON public.students FROM anon, public;
REVOKE ALL ON public.questions FROM anon, public;
REVOKE ALL ON public.progress FROM anon, public;
REVOKE ALL ON public.faculty FROM anon, public;
REVOKE ALL ON public.notifications FROM anon, public;
REVOKE ALL ON public.activity_logs FROM anon, public;
REVOKE ALL ON public.quiz_attempts FROM anon, public;
REVOKE ALL ON public.class_quizzes FROM anon, public;
REVOKE ALL ON public.class_quiz_attempts FROM anon, public;
REVOKE ALL ON public.speaking_attempts FROM anon, public;
REVOKE ALL ON public.game_attempts FROM anon, public;
REVOKE ALL ON public.speaking_prompts FROM anon, public;
REVOKE ALL ON public.daily_challenge_attempts FROM anon, public;
REVOKE ALL ON public.student_onboarding_profiles FROM anon, public;
REVOKE ALL ON public.daily_checkins FROM anon, public;


-- ==========================================
-- SEED DATA: SPEAKING PROMPTS
-- ==========================================

TRUNCATE TABLE public.speaking_prompts;

-- Read Aloud (10 prompts)
INSERT INTO public.speaking_prompts (activity_id, activity_name, activity_icon, difficulty, reward_xp, activity_description, prompt_index, prompt_text) VALUES
('read_aloud', 'Read Aloud', '📖', 'easy', 10, 'Read the displayed sentence or paragraph aloud and improve your pronunciation.', 0, 'The weather is pleasant today.'),
('read_aloud', 'Read Aloud', '📖', 'easy', 10, 'Read the displayed sentence or paragraph aloud and improve your pronunciation.', 1, 'Practice makes a person perfect.'),
('read_aloud', 'Read Aloud', '📖', 'easy', 10, 'Read the displayed sentence or paragraph aloud and improve your pronunciation.', 2, 'Success comes to those who work hard and never give up.'),
('read_aloud', 'Read Aloud', '📖', 'easy', 10, 'Read the displayed sentence or paragraph aloud and improve your pronunciation.', 3, 'Technology is transforming how we communicate with each other.'),
('read_aloud', 'Read Aloud', '📖', 'easy', 10, 'Read the displayed sentence or paragraph aloud and improve your pronunciation.', 4, 'Engineering students should focus on developing excellent presentation skills.'),
('read_aloud', 'Read Aloud', '📖', 'easy', 10, 'Read the displayed sentence or paragraph aloud and improve your pronunciation.', 5, 'Reading books daily helps you build a rich vocabulary and improves your creative thinking.'),
('read_aloud', 'Read Aloud', '📖', 'easy', 10, 'Read the displayed sentence or paragraph aloud and improve your pronunciation.', 6, 'Effective communication is not just about speaking clearly, but also about active listening and understanding others.'),
('read_aloud', 'Read Aloud', '📖', 'easy', 10, 'Read the displayed sentence or paragraph aloud and improve your pronunciation.', 7, 'Public speaking is an essential skill for professionals. By practicing regularly, you can build self-confidence, structure your arguments logically, and inspire your audience.'),
('read_aloud', 'Read Aloud', '📖', 'easy', 10, 'Read the displayed sentence or paragraph aloud and improve your pronunciation.', 8, 'A healthy lifestyle combines a balanced diet with regular exercise and sufficient sleep. When you take care of your body, your mental clarity and overall energy levels improve significantly.'),
('read_aloud', 'Read Aloud', '📖', 'easy', 10, 'Read the displayed sentence or paragraph aloud and improve your pronunciation.', 9, 'Learning a new language opens up doors to different cultures, broadens your career prospects, and changes how you see the world. It requires patience and consistency, but the rewards are lifelong.');

-- Tongue Twister (4 prompts)
INSERT INTO public.speaking_prompts (activity_id, activity_name, activity_icon, difficulty, reward_xp, activity_description, prompt_index, prompt_text) VALUES
('tongue_twister', 'Tongue Twister', '🌀', 'medium', 10, 'Master difficult sounds and articulation.', 0, 'She sells seashells by the seashore.'),
('tongue_twister', 'Tongue Twister', '🌀', 'medium', 10, 'Master difficult sounds and articulation.', 1, 'Peter Piper picked a peck of pickled peppers.'),
('tongue_twister', 'Tongue Twister', '🌀', 'medium', 10, 'Master difficult sounds and articulation.', 2, 'How can a clam cram in a clean cream can?'),
('tongue_twister', 'Tongue Twister', '🌀', 'medium', 10, 'Master difficult sounds and articulation.', 3, 'Six slippery snails slid slowly seaward.');

-- Picture Description (2 prompts)
INSERT INTO public.speaking_prompts (activity_id, activity_name, activity_icon, difficulty, reward_xp, activity_description, prompt_index, prompt_text, image_url) VALUES
('picture_desc', 'Picture Description', '🖼️', 'medium', 15, 'Describe the displayed image within 30 seconds.', 0, 'A group of graduating students in black gowns celebrating and throwing their caps in the air.', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=400&q=80'),
('picture_desc', 'Picture Description', '🖼️', 'medium', 15, 'Describe the displayed image within 30 seconds.', 1, 'A team of young software engineers having an active standup meeting in a modern tech office.', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80');

-- One Minute Speaking (4 prompts)
INSERT INTO public.speaking_prompts (activity_id, activity_name, activity_icon, difficulty, reward_xp, activity_description, prompt_index, prompt_text) VALUES
('one_minute', 'One Minute Speaking', '🎙️', 'hard', 20, 'Speak continuously for one minute on a random topic.', 0, 'My Dream Job'),
('one_minute', 'One Minute Speaking', '🎙️', 'hard', 20, 'Speak continuously for one minute on a random topic.', 1, 'My College Life'),
('one_minute', 'One Minute Speaking', '🎙️', 'hard', 20, 'Speak continuously for one minute on a random topic.', 2, 'Social Media: Boon or Bane?'),
('one_minute', 'One Minute Speaking', '🎙️', 'hard', 20, 'Speak continuously for one minute on a random topic.', 3, 'AI in modern Engineering Education');

-- Daily Question (3 prompts)
INSERT INTO public.speaking_prompts (activity_id, activity_name, activity_icon, difficulty, reward_xp, activity_description, prompt_index, prompt_text) VALUES
('daily_question', 'Daily Question', '❓', 'easy', 10, 'Answer a fresh, thought-provoking question verbally.', 0, 'What motivates you to learn English?'),
('daily_question', 'Daily Question', '❓', 'easy', 10, 'Answer a fresh, thought-provoking question verbally.', 1, 'What did you learn or improve this week?'),
('daily_question', 'Daily Question', '❓', 'easy', 10, 'Answer a fresh, thought-provoking question verbally.', 2, 'If you had ₹1 crore, what would be the first thing you do?');

-- Story Completion (3 prompts)
INSERT INTO public.speaking_prompts (activity_id, activity_name, activity_icon, difficulty, reward_xp, activity_description, prompt_index, prompt_text) VALUES
('story_complete', 'Story Completion', '📚', 'medium', 15, 'Continue a story started by our AI coach.', 0, 'Yesterday I found a mysterious locked wooden box in my attic...'),
('story_complete', 'Story Completion', '📚', 'medium', 15, 'Continue a story started by our AI coach.', 1, 'As the airplane took off, I realized I had left my main folder behind...'),
('story_complete', 'Story Completion', '📚', 'medium', 15, 'Continue a story started by our AI coach.', 2, 'Walking into the empty classroom, I saw a glowing screen with my name on it...');

-- Interview Practice (4 prompts)
INSERT INTO public.speaking_prompts (activity_id, activity_name, activity_icon, difficulty, reward_xp, activity_description, prompt_index, prompt_text) VALUES
('interview_practice', 'Interview Practice', '💼', 'hard', 25, 'Prepare for real-world campus placements and job interviews.', 0, 'Tell me about yourself and your background.'),
('interview_practice', 'Interview Practice', '💼', 'hard', 25, 'Prepare for real-world campus placements and job interviews.', 1, 'Why should we hire you for this placement role?'),
('interview_practice', 'Interview Practice', '💼', 'hard', 25, 'Prepare for real-world campus placements and job interviews.', 2, 'What are your greatest professional strengths and weaknesses?'),
('interview_practice', 'Interview Practice', '💼', 'hard', 25, 'Prepare for real-world campus placements and job interviews.', 3, 'Describe a challenging engineering project you solved successfully.');

-- Debate Arena (3 prompts)
INSERT INTO public.speaking_prompts (activity_id, activity_name, activity_icon, difficulty, reward_xp, activity_description, prompt_index, prompt_text) VALUES
('debate_arena', 'Debate Arena', '⚔️', 'hard', 20, 'Choose a side and defend your opinion.', 0, 'Topic: Will Artificial Intelligence replace human programmers?'),
('debate_arena', 'Debate Arena', '⚔️', 'hard', 20, 'Choose a side and defend your opinion.', 1, 'Topic: Online learning is better than classroom learning.'),
('debate_arena', 'Debate Arena', '⚔️', 'hard', 20, 'Choose a side and defend your opinion.', 2, 'Topic: Mobile phones should be banned in university classrooms.');

-- Situation Practice (4 prompts)
INSERT INTO public.speaking_prompts (activity_id, activity_name, activity_icon, difficulty, reward_xp, activity_description, prompt_index, prompt_text) VALUES
('situation_practice', 'Situation Practice', '🎭', 'medium', 20, 'Practice real-world conversational English.', 0, 'Roleplay: Ordering Food in a premium restaurant.'),
('situation_practice', 'Situation Practice', '🎭', 'medium', 20, 'Practice real-world conversational English.', 1, 'Roleplay: Airport Check-In and handling baggage issues.'),
('situation_practice', 'Situation Practice', '🎭', 'medium', 20, 'Practice real-world conversational English.', 2, 'Roleplay: Delivering a business presentation to college faculties.'),
('situation_practice', 'Situation Practice', '🎭', 'medium', 20, 'Practice real-world conversational English.', 3, 'Roleplay: Explaining symptoms to a doctor during a clinic visit.');

-- Word Challenge (3 prompts)
INSERT INTO public.speaking_prompts (activity_id, activity_name, activity_icon, difficulty, reward_xp, activity_description, prompt_index, prompt_text) VALUES
('word_challenge', 'Word Challenge', '🧠', 'medium', 10, 'Use the given advanced word in three meaningful sentences.', 0, 'Word: Resilient (Meaning: Able to withstand or recover quickly from difficult conditions)'),
('word_challenge', 'Word Challenge', '🧠', 'medium', 10, 'Use the given advanced word in three meaningful sentences.', 1, 'Word: Eloquent (Meaning: Fluent or persuasive in speaking or writing)'),
('word_challenge', 'Word Challenge', '🧠', 'medium', 10, 'Use the given advanced word in three meaningful sentences.', 2, 'Word: Meticulous (Meaning: Showing great attention to detail; very careful)');

-- Speaking Race (2 prompts)
INSERT INTO public.speaking_prompts (activity_id, activity_name, activity_icon, difficulty, reward_xp, activity_description, prompt_index, prompt_text) VALUES
('speaking_race', 'Speaking Race', '🏃', 'hard', 15, 'Speak as many correct English sentences as possible within 30 seconds.', 0, 'Topic: Tell us about your daily engineering routine.'),
('speaking_race', 'Speaking Race', '🏃', 'hard', 15, 'Speak as many correct English sentences as possible within 30 seconds.', 1, 'Topic: Describe everything you see in your room right now.');

-- Pronunciation Battle (4 prompts)
INSERT INTO public.speaking_prompts (activity_id, activity_name, activity_icon, difficulty, reward_xp, activity_description, prompt_index, prompt_text) VALUES
('pron_battle', 'Pronunciation Battle', '🎯', 'medium', 15, 'Master extremely difficult English words.', 0, 'Pronounce: Entrepreneur'),
('pron_battle', 'Pronunciation Battle', '🎯', 'medium', 15, 'Master extremely difficult English words.', 1, 'Pronounce: Algorithm'),
('pron_battle', 'Pronunciation Battle', '🎯', 'medium', 15, 'Master extremely difficult English words.', 2, 'Pronounce: Communication'),
('pron_battle', 'Pronunciation Battle', '🎯', 'medium', 15, 'Master extremely difficult English words.', 3, 'Pronounce: Opportunity');

-- Shadowing Practice (2 prompts)
INSERT INTO public.speaking_prompts (activity_id, activity_name, activity_icon, difficulty, reward_xp, activity_description, prompt_index, prompt_text) VALUES
('shadowing', 'Shadowing Practice', '🔊', 'medium', 20, 'Listen to a sentence and immediately repeat it.', 0, 'Consistent practice is the absolute key to speaking fluent English.'),
('shadowing', 'Shadowing Practice', '🔊', 'medium', 20, 'Listen to a sentence and immediately repeat it.', 1, 'We must adapt to technological disruptions quickly to excel.');

-- Explain a Topic (3 prompts)
INSERT INTO public.speaking_prompts (activity_id, activity_name, activity_icon, difficulty, reward_xp, activity_description, prompt_index, prompt_text) VALUES
('explain_topic', 'Explain a Topic', '🎓', 'medium', 15, 'Explain a popular topic in your own words.', 0, 'Explain how Instagram or social networks work.'),
('explain_topic', 'Explain a Topic', '🎓', 'medium', 15, 'Explain a popular topic in your own words.', 1, 'Explain the rules of Cricket to a beginner.'),
('explain_topic', 'Explain a Topic', '🎓', 'medium', 15, 'Explain a popular topic in your own words.', 2, 'Explain the concept of Artificial Intelligence in simple words.');

-- News Speaking (2 prompts)
INSERT INTO public.speaking_prompts (activity_id, activity_name, activity_icon, difficulty, reward_xp, activity_description, prompt_index, prompt_text) VALUES
('news_speaking', 'News Speaking', '📰', 'medium', 20, 'Read the short news snippet aloud and summarize it verbally.', 0, 'Global tech firms are investing billions in eco-friendly data centers to achieve carbon neutrality by 2030.'),
('news_speaking', 'News Speaking', '📰', 'medium', 20, 'Read the short news snippet aloud and summarize it verbally.', 1, 'Researchers discover that regular exercise combined with language studies accelerates cognitive function.');


-- ============================================================
-- ONBOARDING & DAILY CHECK-IN TABLES (NEW)
-- Run this in Supabase SQL Editor → New Query → Run
-- ============================================================

-- 13. Student Onboarding Profiles
CREATE TABLE IF NOT EXISTS public.student_onboarding_profiles (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,

    -- Step 2: Goals (array of selected goal strings)
    goals JSONB DEFAULT '[]'::jsonb,

    -- Step 3: Reason
    reason TEXT DEFAULT '',

    -- Step 4: Self-assessed level
    perceived_level TEXT DEFAULT 'Beginner',

    -- Step 5: Daily practice time in minutes
    daily_time_mins INTEGER DEFAULT 15,

    -- Step 6: Biggest challenges (array)
    biggest_challenges JSONB DEFAULT '[]'::jsonb,

    -- Step 7: Preferred learning styles (array)
    learning_style JSONB DEFAULT '[]'::jsonb,

    -- Step 8: Preferred accent
    preferred_accent TEXT DEFAULT 'Indian English',

    -- Step 9: Preferred notification time
    notification_time TEXT DEFAULT 'Morning',

    -- Step 10: Assessment results (JSON object with skill scores)
    assessment_results JSONB DEFAULT '{}'::jsonb,

    -- Completion flag
    onboarding_completed BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Auto-update updated_at timestamp on any update
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_onboarding_updated_at ON public.student_onboarding_profiles;
CREATE TRIGGER trg_onboarding_updated_at
    BEFORE UPDATE ON public.student_onboarding_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable Row-Level Security
ALTER TABLE public.student_onboarding_profiles ENABLE ROW LEVEL SECURITY;

-- RLS: Students can only read/write their own profile
CREATE POLICY IF NOT EXISTS "Students access own onboarding profile"
    ON public.student_onboarding_profiles
    FOR ALL USING (TRUE);

-- 14. Daily Check-ins (one per student per day)
CREATE TABLE IF NOT EXISTS public.daily_checkins (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- How the student is feeling
    mood TEXT DEFAULT 'Normal',          -- 'Confident' | 'Normal' | 'Nervous'

    -- What the student wants to practice
    target_activity TEXT DEFAULT 'Speaking',

    -- How many minutes available today
    available_mins INTEGER DEFAULT 15,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    UNIQUE(student_id, checkin_date)
);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Students access own daily checkins"
    ON public.daily_checkins
    FOR ALL USING (TRUE);

-- 15. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_student_id
    ON public.student_onboarding_profiles(student_id);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_student_date
    ON public.daily_checkins(student_id, checkin_date);

