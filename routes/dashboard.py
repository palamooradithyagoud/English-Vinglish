import random
from flask import Blueprint, render_template, session, redirect, url_for, request, jsonify
from database import (
    get_student_by_id, 
    get_levels_completed_count, 
    get_recent_progress, 
    get_all_passed_levels,
    get_notifications,
    get_class_quizzes_for_student,
    update_student_xp_and_level,
    log_student_activity,
    get_questions_for_level
)
from routes.practice_data import PRACTICE_QUESTIONS, GRAMMAR_LESSONS, SHORT_STORIES, WORD_SCRAMBLE_WORDS
from routes.auth import login_required
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

def calculate_streak(student_id):
    """
    Dynamically calculates the current daily streak of quiz completions.
    Looks at 'completed_at' dates in the in-memory progress dataset.
    """
    attempts = get_recent_progress(student_id, limit=100)
    passed_attempts = [a for a in attempts if a['status'] == 'passed']
    
    if not passed_attempts:
        return 0
        
    # Extract unique dates, sorted descending
    unique_dates = sorted(list({a['completed_at'].date() for a in passed_attempts}), reverse=True)
    
    if not unique_dates:
        return 0
        
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    
    # Check if they completed a quiz today or yesterday to continue streak
    if unique_dates[0] not in (today, yesterday):
        return 0
        
    streak = 1
    current_date = unique_dates[0]
    
    for next_date in unique_dates[1:]:
        if (current_date - next_date).days == 1:
            streak += 1
            current_date = next_date
        elif (current_date - next_date).days == 0:
            continue  # same day completion, ignore
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
        
    levels_completed = get_levels_completed_count(student_id)
    streak = calculate_streak(student_id)
    
    # Fetch recent history
    history_records = get_recent_progress(student_id, limit=5)
    
    history = []
    for record in history_records:
        history.append({
            'level': record['level'],
            'score': record['score'],
            'percentage': record['percentage'],
            'status': record['status'],
            'completed_at': record['completed_at'].strftime("%Y-%m-%d %H:%M")
        })
        
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
    class_quizzes = get_class_quizzes_for_student(student_id, student['branch'])
    return render_template('dashboard.html', student=student_data, history=history, announcements=announcements, class_quizzes=class_quizzes)

@dashboard_bp.route('/progress')
@login_required
def progress():
    student_id = session['student_id']
    student = get_student_by_id(student_id)
    
    if not student:
        session.clear()
        return redirect(url_for('auth.login'))
        
    current_level = student['current_level']
    passed_levels = get_all_passed_levels(student_id)
    
    # Build states for levels 1 to 5
    levels = []
    for lvl in range(1, 6):
        if lvl in passed_levels:
            status = 'completed'
        elif lvl <= current_level:
            status = 'unlocked'
        else:
            # Level L is unlocked if L-1 is completed
            if (lvl - 1) in passed_levels:
                status = 'unlocked'
            else:
                status = 'locked'
        levels.append({
            'number': lvl,
            'status': status
        })
        
    return render_template(
        'progress.html', 
        levels=levels, 
        lessons=GRAMMAR_LESSONS, 
        stories=SHORT_STORIES, 
        scramble_words=WORD_SCRAMBLE_WORDS,
        student=student
    )

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
        
    system_prompt = (
        "You are Bujji, a helpful, encouraging, and slightly quirky robot assistant for English learning. "
        "Your responses should be friendly, polite, contain emojis, and be limited to a maximum of 3 sentences. "
        "Help the student with their English, explain grammar terms, write small jokes, or give encouraging quotes."
    )
    
    payload = {
        "model": "mixtral-8x7b-32768",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.7,
        "max_tokens": 150
    }
    
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
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

