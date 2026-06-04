from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from database import (
    get_total_students_count,
    get_active_students_count,
    get_average_quiz_accuracy,
    get_total_quiz_attempts,
    get_total_levels_completed_count,
    get_top_performing_student,
    get_students_list,
    get_student_by_id,
    get_student_quiz_accuracy_trend,
    get_student_xp_growth,
    get_student_weekly_activity,
    get_student_level_completions,
    detect_weak_students,
    create_notification,
    get_notifications,
    get_top_students,
    get_levels_completed_count,
    get_recent_progress,
    create_class_quiz,
    get_all_class_quizzes,
    get_class_quiz_results_for_faculty
)
from routes.faculty_auth import faculty_login_required
from routes.dashboard import calculate_streak

faculty_dashboard_bp = Blueprint('faculty_dashboard', __name__)

@faculty_dashboard_bp.route('/faculty/dashboard')
@faculty_login_required
def dashboard():
    stats = {
        'total_students': get_total_students_count(),
        'active_students': get_active_students_count(),
        'avg_accuracy': get_average_quiz_accuracy(),
        'total_attempts': get_total_quiz_attempts(),
        'levels_completed': get_total_levels_completed_count(),
    }
    
    top_student = get_top_performing_student()
    stats['top_performer'] = top_student['full_name'] if top_student else "None"
    
    weak_students = detect_weak_students()
    announcements = get_notifications(limit=5)
    
    return render_template(
        'faculty/dashboard.html', 
        stats=stats, 
        weak_students=weak_students, 
        announcements=announcements
    )

@faculty_dashboard_bp.route('/faculty/students')
@faculty_login_required
def students():
    branch = request.args.get('branch', 'All')
    year = request.args.get('year', 'All')
    level = request.args.get('level', 'All')
    search_query = request.args.get('search', '')
    
    student_list = get_students_list(
        branch=None if branch == 'All' else branch,
        year=None if year == 'All' else year,
        level=None if level == 'All' else level,
        search_query=search_query
    )
    
    # Extra branch list for dropdowns
    branches = ['CSE', 'CSE AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'Chemical']
    years = [1, 2, 3, 4]
    levels = [1, 2, 3, 4, 5]
    
    return render_template(
        'faculty/students.html',
        students=student_list,
        selected_branch=branch,
        selected_year=year,
        selected_level=level,
        search_query=search_query,
        branches=branches,
        years=years,
        levels=levels
    )

@faculty_dashboard_bp.route('/faculty/student/<int:student_id>')
@faculty_login_required
def student_detail(student_id):
    student = get_student_by_id(student_id)
    if not student:
        flash("Student not found.", "error")
        return redirect(url_for('faculty_dashboard.students'))
        
    streak = calculate_streak(student_id)
    levels_completed = get_levels_completed_count(student_id)
    history_records = get_recent_progress(student_id, limit=10)
    
    history = []
    for record in history_records:
        history.append({
            'level': record['level'],
            'score': record['score'],
            'percentage': record['percentage'],
            'status': record['status'],
            'completed_at': record['completed_at'].strftime("%Y-%m-%d %H:%M")
        })
        
    return render_template(
        'faculty/student_detail.html',
        student=student,
        streak=streak,
        levels_completed=levels_completed,
        history=history
    )

@faculty_dashboard_bp.route('/faculty/student/<int:student_id>/api/data')
@faculty_login_required
def student_api_data(student_id):
    """
    JSON API for Chart.js visual metrics
    """
    accuracy_trend = get_student_quiz_accuracy_trend(student_id)
    xp_growth = get_student_xp_growth(student_id)
    weekly_activity = get_student_weekly_activity(student_id)
    level_completions = get_student_level_completions(student_id)
    
    # Format level completions for chart
    # E.g. level completion speed/score
    formatted_completions = []
    for c in level_completions:
        formatted_completions.append({
            'level': c['level'],
            'score': c['score'],
            'percentage': c['percentage'],
            'completed_at': c['completed_at'].strftime("%Y-%m-%d")
        })
        
    return jsonify({
        'accuracy_trend': accuracy_trend,
        'xp_growth': xp_growth,
        'weekly_activity': weekly_activity,
        'level_completions': formatted_completions
    })

@faculty_dashboard_bp.route('/faculty/leaderboard')
@faculty_login_required
def leaderboard():
    top_students = get_top_students(limit=10)
    return render_template('faculty/leaderboard.html', students=top_students)

@faculty_dashboard_bp.route('/faculty/notifications', methods=['GET', 'POST'])
@faculty_login_required
def notifications():
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        message = request.form.get('message', '').strip()
        faculty_id = session['faculty_id']
        
        if not (title and message):
            flash("Title and Message are required.", "error")
        else:
            try:
                create_notification(title, message, faculty_id)
                flash("Announcement published successfully!", "success")
                return redirect(url_for('faculty_dashboard.dashboard'))
            except Exception as e:
                flash(f"Error publishing announcement: {e}", "error")
                
    announcements = get_notifications(limit=20)
    return render_template('faculty/notifications.html', announcements=announcements)

@faculty_dashboard_bp.route('/faculty/class_quizzes')
@faculty_login_required
def class_quizzes():
    quizzes = get_all_class_quizzes()
    results = get_class_quiz_results_for_faculty()
    branches = ['CSE', 'CSE AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'Chemical']
    
    return render_template(
        'faculty/class_quizzes.html',
        quizzes=quizzes,
        results=results,
        branches=branches
    )

@faculty_dashboard_bp.route('/faculty/class_quizzes/create', methods=['POST'])
@faculty_login_required
def create_class_quiz_route():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    target_type = data.get('target_type', 'all')
    target_branch = data.get('target_branch', '')
    questions = data.get('questions', [])
    
    if not title or not questions:
        return jsonify({'error': 'Title and questions are required'}), 400
        
    faculty_id = session['faculty_id']
    
    # Save the quiz
    quiz = create_class_quiz(title, target_type, target_branch, faculty_id, questions)
    if not quiz:
        return jsonify({'error': 'Failed to save quiz in database'}), 500
        
    # Trigger notification/announcement
    target_str = target_branch if target_type == 'branch' else 'all departments'
    create_notification(
        title=f"New Class Quiz: {title}",
        message=f"A new custom class quiz has been posted for {target_str}. Go to your Class Quizzes section on the dashboard to attempt it!",
        created_by=faculty_id
    )
    
    return jsonify({'success': True})

