-- Supabase Schema DDL Setup Script (Updated)
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
