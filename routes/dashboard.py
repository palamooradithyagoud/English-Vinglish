from flask import Blueprint, render_template, session, redirect, url_for
from database import (
    get_student_by_id, 
    get_levels_completed_count, 
    get_recent_progress, 
    get_all_passed_levels,
    get_notifications,
    get_class_quizzes_for_student
)
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
        
    return render_template('progress.html', levels=levels)
