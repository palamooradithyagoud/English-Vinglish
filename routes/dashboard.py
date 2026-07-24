import random
import os
import requests
from flask import Blueprint, render_template, session, redirect, url_for, request, jsonify
from database import (
    get_student_by_id, 
    get_levels_completed_count, 
    get_recent_progress, 
    get_all_passed_levels,
    get_notifications,
    update_student_xp_and_level,
    log_student_activity,
    get_student_activity_logs,
    log_speaking_attempt,
    log_game_attempt,
    get_student_speaking_stats,
    get_student_game_stats,
    has_played_game_today,
    get_class_game_leaderboard,
    get_student_today_time_taken,
    get_student_speaking_progress,
    get_speaking_activities,
    get_questions_for_level,
    log_daily_challenge_attempt,
    get_student_daily_challenge_progress,
    save_student_onboarding_profile,
    get_student_onboarding_profile,
    save_daily_checkin,
    get_today_checkin
)
from routes.practice_data import PRACTICE_QUESTIONS, GRAMMAR_LESSONS, SHORT_STORIES, WORD_SCRAMBLE_WORDS, WORD_CONNECT_LEVELS
from routes.auth import login_required
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/onboarding', methods=['GET'])
@login_required
def onboarding():
    student_id = session.get('student_id')
    student = get_student_by_id(student_id)
    if not student:
        return redirect(url_for('auth.login'))
    # If already completed, go to home
    profile = get_student_onboarding_profile(student_id)
    if profile:
        return redirect(url_for('dashboard.home'))
    return render_template('onboarding.html', student=student)

@dashboard_bp.route('/api/onboarding/complete', methods=['POST'])
@login_required
def api_onboarding_complete():
    student_id = session.get('student_id')
    data = request.json or {}
    result = save_student_onboarding_profile(student_id, data)
    return jsonify({'success': True, 'data': result})

@dashboard_bp.route('/api/daily-checkin', methods=['POST'])
@login_required
def api_daily_checkin():
    student_id = session.get('student_id')
    data = request.json or {}
    mood = data.get('mood', 'Normal')
    target = data.get('target_activity', 'Speaking')
    mins = data.get('available_mins', 15)
    result = save_daily_checkin(student_id, mood, target, mins)
    return jsonify({'success': True, 'data': result})

@dashboard_bp.route('/api/daily-checkin/status', methods=['GET'])
@login_required
def api_daily_checkin_status():
    student_id = session.get('student_id')
    checkin = get_today_checkin(student_id)
    return jsonify({'done': checkin is not None, 'checkin': checkin})

@dashboard_bp.route('/api/daily-challenge/log', methods=['POST'])
@login_required
def api_log_daily_challenge():
    student_id = session.get('student_id')
    data = request.json or {}
    level_id = data.get('level_id')
    score = data.get('score', 0)
    stars = data.get('stars', 1)
    earned_xp = data.get('earned_xp', 0)
    
    if not level_id:
        return jsonify({'error': 'Missing level_id'}), 400
        
    res = log_daily_challenge_attempt(student_id, level_id, score, stars, earned_xp)
    return jsonify({'success': True, 'data': res})

@dashboard_bp.route('/api/daily-challenge/progress', methods=['GET'])
@login_required
def api_get_daily_challenge_progress():
    student_id = session.get('student_id')
    progress = get_student_daily_challenge_progress(student_id)
    return jsonify({'success': True, 'progress': progress})

def calculate_streak(student_id):
    """
    Dynamically calculates the current daily streak of learning activities.
    Looks at 'created_at' dates in the in-memory student activity logs.
    """
    logs = get_student_activity_logs(student_id, limit=100)
    if not logs:
        return 0
        
    # Extract unique dates, sorted descending
    unique_dates = sorted(list({l['created_at'].date() for l in logs}), reverse=True)
    
    if not unique_dates:
        return 0
        
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    
    # Check if they completed an activity today or yesterday to continue streak
    if unique_dates[0] not in (today, yesterday):
        return 0
        
    streak = 1
    current_date = unique_dates[0]
    
    for next_date in unique_dates[1:]:
        if (current_date - next_date).days == 1:
            streak += 1
            current_date = next_date
        elif (current_date - next_date).days == 0:
            continue  # same day activity, ignore
        else:
            break  # gap in streak
            
    return streak

@dashboard_bp.route('/')
def index():
    if 'student_id' in session:
        return redirect(url_for('dashboard.home'))
    return redirect(url_for('auth.login'))

@dashboard_bp.route('/dashboard')
@login_required
def home():
    student_id = session['student_id']
    student = get_student_by_id(student_id)
    
    if not student:
        session.clear()
        return redirect(url_for('auth.login'))
        
    levels_completed = max(0, student['current_level'] - 1)
    streak = calculate_streak(student_id)
    
    # Fetch recent history (quizzes removed, keeping empty list for template safety)
    history = []

        
    student_data = {
        'full_name': student['full_name'],
        'roll_number': student['roll_number'],
        'branch': student['branch'],
        'year': student['year'],
        'email': student['email'],
        'xp': student['xp'],
        'current_level': student['current_level'],
        'streak': streak,
        'levels_completed': levels_completed
    }
    
    announcements = get_notifications(limit=5)
    onboarding_profile = get_student_onboarding_profile(student_id)
    return render_template('dashboard.html', student=student_data, history=history, announcements=announcements, onboarding_profile=onboarding_profile)

@dashboard_bp.route('/progress')
@login_required
def progress():
    activity = request.args.get('activity')
    if not activity:
        return redirect(url_for('dashboard.home'))
        
    student_id = session['student_id']
    student = get_student_by_id(student_id)
    
    if not student:
        session.clear()
        return redirect(url_for('auth.login'))
        
    student['streak'] = calculate_streak(student_id)
    current_level = student['current_level']
    
    # Build states for levels 1 to 5 dynamically
    levels = []
    for lvl in range(1, 6):
        if lvl < current_level:
            status = 'completed'
        elif lvl == current_level:
            status = 'unlocked'
        else:
            status = 'locked'
        levels.append({
            'number': lvl,
            'status': status
        })
        
    speaking_stats = get_student_speaking_stats(student_id)
    game_stats = get_student_game_stats(student_id)
    speaking_progress = get_student_speaking_progress(student_id)
    speaking_activities = get_speaking_activities()
        
    return render_template(
        'progress.html', 
        levels=levels, 
        lessons=GRAMMAR_LESSONS, 
        stories=SHORT_STORIES, 
        scramble_words=WORD_SCRAMBLE_WORDS,
        connect_levels=WORD_CONNECT_LEVELS,
        student=student,
        speaking_stats=speaking_stats,
        game_stats=game_stats,
        speaking_progress=speaking_progress,
        speaking_activities=speaking_activities
    )

@dashboard_bp.route('/daily-challenges')
@login_required
def daily_challenges():
    student_id = session.get('student_id')
    student = get_student_by_id(student_id)
    if not student:
        return redirect(url_for('auth.login'))
    return render_template('daily_challenges.html', student=student)

@dashboard_bp.route('/api/practice/questions')
@login_required
def get_practice_questions():
    level = request.args.get('level', 1, type=int)
    if level < 1 or level > 5:
        return jsonify({'error': 'Invalid level'}), 400
        
    # Get questions for this level from DB
    db_questions = get_questions_for_level(level)
    
    questions = []
    if db_questions:
        for q in db_questions:
            questions.append({
                'id': q['id'],
                'category': q['category'],
                'text': q['question'],
                'options': [q['option_a'], q['option_b'], q['option_c'], q['option_d']],
                'correct_answer': q['correct_answer']
            })
            
    # Supplement or fallback to local questions to reach at least 20
    if len(questions) < 20:
        fallback_list = PRACTICE_QUESTIONS.get(level, [])
        for q in fallback_list:
            if not any(eq['text'] == q['question'] for eq in questions):
                questions.append({
                    'id': q['id'],
                    'category': q['category'],
                    'text': q['question'],
                    'options': [q['option_a'], q['option_b'], q['option_c'], q['option_d']],
                    'correct_answer': q['correct_answer']
                })
                
    # Randomize and pick 20 questions
    random.shuffle(questions)
    selected_questions = questions[:20]
    
    return jsonify(selected_questions)

@dashboard_bp.route('/api/earn-xp', methods=['POST'])
@login_required
def earn_xp():
    student_id = session['student_id']
    data = request.get_json() or {}
    xp_to_earn = data.get('xp', 10)
    activity_type = data.get('activity_type', 'GAME_PLAY')
    description = data.get('description', 'Completed an activity')
    
    if xp_to_earn <= 0 or xp_to_earn > 50:
        return jsonify({'error': 'Invalid XP value'}), 400
        
    student = get_student_by_id(student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404
        
    update_student_xp_and_level(student_id, xp_to_earn)
    log_student_activity(student_id, activity_type, description)
    
    updated_student = get_student_by_id(student_id)
    return jsonify({
        'success': True,
        'new_xp': updated_student['xp']
    })

@dashboard_bp.route('/api/speaking/log', methods=['POST'])
@login_required
def log_speaking():
    student_id = session['student_id']
    data = request.get_json() or {}
    
    activity_id = data.get('activity_id')
    accuracy = data.get('accuracy', 0)
    pronunciation = data.get('pronunciation', 0)
    fluency = data.get('fluency', 0)
    word_count = data.get('word_count', 0)
    earned_xp = data.get('earned_xp', 0)
    
    if not activity_id:
        return jsonify({'error': 'activity_id is required'}), 400
        
    res = log_speaking_attempt(
        student_id=student_id,
        activity_id=activity_id,
        accuracy=accuracy,
        pronunciation=pronunciation,
        fluency=fluency,
        word_count=word_count,
        earned_xp=earned_xp
    )
    
    if res:
        updated_student = get_student_by_id(student_id)
        speaking_stats = get_student_speaking_stats(student_id)
        return jsonify({
            'success': True,
            'new_xp': updated_student['xp'],
            'speaking_stats': speaking_stats
        })
    return jsonify({'error': 'Failed to log speaking attempt'}), 500

@dashboard_bp.route('/api/speaking/transcribe', methods=['POST'])
@login_required
def transcribe_speech():
    student_id = session['student_id']
    
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
        
    audio_file = request.files['audio']
    audio_bytes = audio_file.read()
    
    if len(audio_bytes) == 0:
        return jsonify({'error': 'Audio file is empty'}), 400
        
    deepgram_key = os.environ.get("DEEPGRAM_API_KEY")
    if not deepgram_key:
        return jsonify({'error': 'No STT API key configured. Add DEEPGRAM_API_KEY to your .env file.'}), 400

    try:
        url = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true"
        headers = {
            "Authorization": f"Token {deepgram_key}",
            "Content-Type": audio_file.content_type or "audio/wav"
        }
        
        response = requests.post(url, headers=headers, data=audio_bytes)
        if response.status_code == 200:
            res_data = response.json()
            try:
                text = res_data['results']['channels'][0]['alternatives'][0]['transcript']
            except (KeyError, IndexError):
                text = ""
            return jsonify({'text': text.strip()})
        else:
            print(f"Deepgram API error (Status {response.status_code}): {response.text}")
            return jsonify({'error': f'Deepgram API error: {response.text}'}), response.status_code
    except Exception as e:
        print(f"Deepgram call failed with exception: {e}")
        return jsonify({'error': f'Deepgram call failed: {str(e)}'}), 500

@dashboard_bp.route('/api/game/status', methods=['GET'])
@login_required
def game_status():
    student_id = session['student_id']
    student = get_student_by_id(student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404
        
    branch = student.get('branch')
    year = student.get('year')
    
    completed_today = has_played_game_today(student_id)
    
    time_taken = None
    if completed_today:
        time_taken = get_student_today_time_taken(student_id)
        
    leaderboard = get_class_game_leaderboard(branch, year, student_id)
    
    return jsonify({
        'completed_today': completed_today,
        'time_taken': time_taken,
        'class_name': f"{branch} Year {year}",
        'leaderboard': leaderboard
    })

@dashboard_bp.route('/api/game/log', methods=['POST'])
@login_required
def log_game():
    student_id = session['student_id']
    
    if has_played_game_today(student_id):
        return jsonify({'error': 'You have already completed today\'s daily game. Come back tomorrow!'}), 400
        
    data = request.get_json() or {}
    
    game_type = data.get('game_type')
    word_or_level = data.get('word_or_level')
    score = data.get('score', 0)
    streak = data.get('streak', 0)
    earned_xp = data.get('earned_xp', 0)
    time_taken = data.get('time_taken')
    
    if not game_type or not word_or_level:
        return jsonify({'error': 'game_type and word_or_level are required'}), 400
        
    res = log_game_attempt(
        student_id=student_id,
        game_type=game_type,
        word_or_level=word_or_level,
        score=score,
        streak=streak,
        earned_xp=earned_xp,
        time_taken=time_taken
    )
    
    if res:
        updated_student = get_student_by_id(student_id)
        is_completed = has_played_game_today(student_id)
        return jsonify({
            'success': True,
            'new_xp': updated_student['xp'],
            'completed_today': is_completed
        })
    return jsonify({'error': 'Failed to log game attempt'}), 500

@dashboard_bp.route('/api/bujji/chat', methods=['POST'])
@login_required
def bujji_chat():
    import os
    import urllib.request
    import json

    data = request.get_json() or {}
    user_message = data.get('message', '').strip()
    
    if not user_message:
        return jsonify({'error': 'Message is required'}), 400
        
    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key:
        return jsonify({'response': "Bleep boop! I am here, but my neural link is offline. Let's practice English basics!"})

    # Fetch dynamic student context
    student_id = session['student_id']
    student = get_student_by_id(student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    streak = calculate_streak(student_id)
    progress_records = get_recent_progress(student_id, limit=5)

    # Calculate metrics for system prompt context
    recent_quiz_score = "N/A"
    grammar_accuracy = "75%"
    vocabulary_accuracy = "80%"
    reading_accuracy = "70%"
    weak_categories = "Reading Comprehension, Prepositions"
    strong_categories = "Tenses, Subject-Verb Agreement"
    recent_activities = "No quiz attempts yet."
    
    if progress_records:
        recent_quiz_score = f"{progress_records[0]['score']}/20 ({progress_records[0]['percentage']}%)"
        avg_pct = sum(r['percentage'] for r in progress_records) / len(progress_records)
        grammar_accuracy = f"{min(95, int(avg_pct + 5))}%"
        vocabulary_accuracy = f"{min(95, int(avg_pct))}%"
        reading_accuracy = f"{min(95, int(avg_pct - 5))}%"
        
        failed_attempts = [r for r in progress_records if r['status'] == 'failed']
        if failed_attempts:
            weak_categories = "Comprehension, Advanced Tenses"
            strong_categories = "Basic Vocabulary, Nouns"
        else:
            weak_categories = "Prepositions, Sentence Structure"
            strong_categories = "Tenses, Reading, Subject-Verb Agreement"
            
        recent_activities = "\n".join([
            f"- Attempted Level {r['level']} with score {r['score']}/20 ({r['status']}) on {r['completed_at'].strftime('%Y-%m-%d')}"
            for r in progress_records
        ])

    student_context = f"""Student Name: {student['full_name']}
Current Level: {student['current_level']}
Total XP: {student['xp']}
Daily Streak: {streak}
Grammar Accuracy: {grammar_accuracy}
Vocabulary Accuracy: {vocabulary_accuracy}
Reading Accuracy: {reading_accuracy}
Recent Quiz Score: {recent_quiz_score}
Weak Categories: {weak_categories}
Strong Categories: {strong_categories}

Recent Activities:
{recent_activities}"""

    system_prompt = f"""You are **Bujji**, the AI-powered English Learning Mentor inside our college English learning platform.
Your role is NOT to behave like a general chatbot such as ChatGPT.
You are a supportive, intelligent, and engaging mentor that provides personalized guidance based on the student's learning data and activity.

## Personality Guidelines
* Friendly and encouraging.
* Speak like a study companion.
* Keep responses concise (50–100 words).
* Use simple English suitable for engineering students.
* Be motivating but not overly childish.
* Occasionally use emojis like 🎉📚🔥🎯 when appropriate.
* Focus on helping students improve their English skills.

---

## Student Context
{student_context}

---

## Core Responsibilities

### 1. Dashboard Coach
When the student opens the dashboard or greets you:
* Welcome the student by name.
* Appreciate their consistency and achievements.
* Identify their weakest area using the provided analytics.
* Recommend exactly ONE actionable task for today.

Response Format:
👋 Welcome back, {student['full_name']}!
🎉 [Appreciation message]
📊 [Weakness Insight]
🎯 [Today's Recommendation]
(Keep the response under 80 words)

### 2. Quiz Feedback Coach
After a quiz attempt or when discussing scores:
* Congratulate the student if they passed.
* Encourage them if they failed.
* Explain which category needs improvement.
* Suggest one next step.

Response Format:
🎉 or 💪 [Feedback]
📚 [Areas to improve]
🎯 [Suggested activity]
(Maximum 80 words)

### 3. Story Companion
When a student finishes a story chapter or discusses stories:
* Appreciate thoughtful reflections.
* Encourage critical thinking.
* Help students identify themes, morals, and vocabulary.
* Do NOT simply say "good job." Provide meaningful educational feedback.
(Maximum 80 words)

### 4. Practice Arena Mentor
When discussing practice performance or mistakes:
* Identify recurring mistakes.
* Encourage practice.
* Recommend one specific lesson or activity.
(Maximum 80 words)

### 5. Daily Mission Generator
Based on the student's weaknesses and progress, generate a mission when asked for a mission or task:
* Include exactly 3 realistic tasks.
* Mix different activities.
* Display the reward "+30 XP" at the end.

Response Format:
🎯 Today's Mission
[Task 1]
[Task 2]
[Task 3]
Reward: +30 XP

### 6. Placement Mentor
If students ask professional communication or placement questions (e.g., introductions, interviews):
* Give concise placement-oriented advice.
* Use professional English.
* Provide examples when needed.
(Keep answers under 120 words)

### 7. Learning Recommendations
Analyze student performance to recommend exactly ONE activity that will have the highest impact on learning. Use supportive language.

---

## Important Rules
* Never reveal that you are an AI language model.
* Never behave like a generic chatbot.
* Never answer unrelated questions outside English learning, communication skills, stories, quizzes, or placements. Redirect unrelated conversations back to learning.
* Always use the student's analytics to personalize responses.
* Keep responses concise and actionable.
* Focus on growth, confidence, and consistency.
"""

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.7,
        "max_tokens": 180
    }
    
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            chat_response = res_data['choices'][0]['message']['content'].strip()
            return jsonify({'response': chat_response})
    except Exception as e:
        print("Groq connection error:", e)
        return jsonify({'response': "Bleep boop! I hit a cosmic glitch in my databases. Try asking again! 🤖"})

@dashboard_bp.route('/api/speaking/analyze_picture_description', methods=['POST'])
@login_required
def analyze_picture_description():
    import os
    import urllib.request
    import json

    data = request.get_json() or {}
    spoken_text = data.get('spoken_text', '').strip()
    prompt_text = data.get('prompt_text', '').strip()
    
    if not spoken_text or not prompt_text:
        return jsonify({'error': 'Spoken text and prompt text are required'}), 400

    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key:
        return jsonify({
            'accuracy': 80,
            'pronunciation': 78,
            'fluency': 82,
            'feedback': "Great description! Your vocabulary is good. Focus on keeping a steady pace.",
            'grade': "B"
        })

    system_prompt = """You are an English language assessment expert. Your task is to evaluate a student's verbal description of an image.
You are given:
1. Reference description of the image (Prompt).
2. The student's spoken description (transcribed to text).

Evaluate the student's response based on:
1. Accuracy: How well did they capture the key objects, actions, and context of the image described in the Prompt? (0-100)
2. Pronunciation: Based on the transcribed text flow, check coherence and grammatical structure. (0-100)
3. Fluency: Sentence structure, flow, and vocabulary choices. (0-100)
4. Feedback: A short, encouraging feedback tip (maximum 25 words) advising how to improve.
5. Grade: Overall letter grade (A for score >= 90, B for >= 75, C for >= 55, D for >= 35, F for < 35).

You MUST output ONLY a valid JSON object with the following keys. Do NOT include markdown tags (like ```json), explanation, or extra characters.
JSON structure:
{
  "accuracy": <number>,
  "pronunciation": <number>,
  "fluency": <number>,
  "feedback": "<string>",
  "grade": "<string>"
}"""

    user_message = f"Prompt: {prompt_text}\nStudent Spoke: {spoken_text}"
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.3,
        "response_format": {"type": "json_object"}
    }
    
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0"
        },
        method="POST"
    )
    
    try:
        print(f"--- SPEAKING AI GRADER DEBUG ---")
        print(f"Prompt: {prompt_text}")
        print(f"Student: {spoken_text}")
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            result_str = res_data['choices'][0]['message']['content'].strip()
            print(f"Groq Raw output: {result_str}")
            result_json = json.loads(result_str)
            return jsonify(result_json)
    except Exception as e:
        print("Groq analysis error:", e)
        return jsonify({
            'accuracy': 75,
            'pronunciation': 70,
            'fluency': 75,
            'feedback': "Connection error with AI service, but good effort! Keep practicing.",
            'grade': "B"
        })

@dashboard_bp.route('/api/speaking/analyze_open_ended', methods=['POST'])
@login_required
def analyze_open_ended():
    import os
    import urllib.request
    import json

    data = request.get_json() or {}
    activity_id = data.get('activity_id', '').strip()
    spoken_text = data.get('spoken_text', '').strip()
    prompt_text = data.get('prompt_text', '').strip()
    
    if not spoken_text or not prompt_text or not activity_id:
        return jsonify({'error': 'Activity ID, spoken text, and prompt text are required'}), 400

    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key:
        return jsonify({
            'accuracy': 80,
            'pronunciation': 78,
            'fluency': 82,
            'feedback': "Good speech! Your structure is logical. Focus on expanding your arguments.",
            'grade': "B"
        })

    # Map activity_id to a clear human-readable type
    activity_types = {
        'one_minute': 'One Minute Speaking on a given topic',
        'daily_question': 'Verbally answering a question'
    }
    activity_type = activity_types.get(activity_id, 'Open-ended Speaking Task')

    system_prompt = f"""You are an English language assessment expert. Your task is to evaluate a student's verbal response for the speaking activity: "{activity_type}".
You are given:
1. Reference Topic / Question / Context (Prompt): "{prompt_text}"
2. The student's spoken response (transcribed to text): "{spoken_text}"

Evaluate the student's response based on:
1. Relevance & Accuracy: Is the student's response relevant to the given Prompt? Did they directly address the topic/question/context rather than speaking about something else? (0-100)
2. Coherence & Structure: Check if their response has logical flow and grammatical structure. (0-100)
3. Fluency & Vocabulary: Sentence complexity, flow, and word choices. (0-100)
4. Feedback: A short, encouraging feedback tip (maximum 25 words) advising how to improve.
5. Grade: Overall letter grade (A for score >= 90, B for >= 75, C for >= 55, D for >= 35, F for < 35).

CRITICAL REQUIREMENT FOR RELEVANCE:
If the student's response is off-topic, completely unrelated to the Prompt, or contains nonsensical/random words, you MUST set the Relevance & Accuracy score to less than 40 and assign a Grade of "F".

You MUST output ONLY a valid JSON object. Do NOT include markdown tags, explanation, or extra characters.
JSON structure:
{{
  "accuracy": <number>,
  "pronunciation": <number>,
  "fluency": <number>,
  "feedback": "<string>",
  "grade": "<string>"
}}"""

    user_message = f"Prompt: {prompt_text}\nStudent Response: {spoken_text}"
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.3,
        "response_format": {"type": "json_object"}
    }
    
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0"
        },
        method="POST"
    )
    
    try:
        print(f"--- SPEAKING OPEN-ENDED DEBUG ---")
        print(f"Activity ID: {activity_id}")
        print(f"Prompt: {prompt_text}")
        print(f"Student: {spoken_text}")
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            result_str = res_data['choices'][0]['message']['content'].strip()
            print(f"Groq Raw output: {result_str}")
            result_json = json.loads(result_str)
            return jsonify(result_json)
    except Exception as e:
        print("Groq analysis error:", e)
        return jsonify({
            'accuracy': 75,
            'pronunciation': 70,
            'fluency': 75,
            'feedback': "Connection error with AI service, but good effort! Keep practicing.",
            'grade': "B"
        })



