import time
from flask import Blueprint, render_template, jsonify, request, session
from database import (
    get_student_by_id, 
    get_questions_for_level, 
    update_student_xp_and_level, 
    add_progress_record,
    add_quiz_attempt,
    log_student_activity,
    get_class_quiz_by_id,
    submit_class_quiz_attempt
)
from routes.auth import login_required

quiz_bp = Blueprint('quiz', __name__)

@quiz_bp.route('/quiz')
@login_required
def quiz_page():
    level = request.args.get('level', 1, type=int)
    # Store requested level in session
    session['quiz_level'] = level
    # Start timer
    session['quiz_start_time'] = time.time()
    
    student_id = session['student_id']
    log_student_activity(student_id, 'QUIZ_START', f"Started quiz for Level {level}")
    
    return render_template('quiz.html', level=level)

@quiz_bp.route('/api/questions')
@login_required
def get_questions():
    try:
        level = session.get('quiz_level', 1)
        db_questions = get_questions_for_level(level)
        
        questions = []
        for q in db_questions:
            questions.append({
                'id': q['id'],
                'category': q['category'],
                'text': q['question'],
                'options': [
                    q['option_a'],
                    q['option_b'],
                    q['option_c'],
                    q['option_d']
                ]
            })
            
        return jsonify(questions)
    except Exception as e:
        print(f"Error fetching questions: {e}")
        return jsonify({'error': 'Failed to fetch questions'}), 500

@quiz_bp.route('/api/submit_quiz', methods=['POST'])
@login_required
def submit_quiz():
    student_id = session['student_id']
    data = request.get_json() or {}
    user_answers = data.get('answers', [])
    
    if not isinstance(user_answers, list):
        return jsonify({'error': 'Invalid format'}), 400
        
    try:
        level = session.get('quiz_level', 1)
        
        # Calculate duration
        start_time = session.get('quiz_start_time')
        duration = int(time.time() - start_time) if start_time else 0
        
        # Fetch original questions to grade
        db_questions = get_questions_for_level(level)
        correct_answers = [q['correct_answer'] for q in db_questions]
        total_questions = len(correct_answers)
        
        if len(user_answers) < total_questions:
            return jsonify({'error': 'Missing answers'}), 400
            
        correct_count = 0
        for idx in range(total_questions):
            if int(user_answers[idx]) == correct_answers[idx]:
                correct_count += 1
                
        percentage = round((correct_count / total_questions) * 100)
        has_passed = percentage >= 70
        status = 'passed' if has_passed else 'failed'
        xp_earned = correct_count * 10
        
        student = get_student_by_id(student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404
            
        current_level = student['current_level']
        
        # Determine level unlocks
        next_level = None
        level_unlocked = False
        if has_passed and level == current_level:
            next_level = current_level + 1
            level_unlocked = True
            
        # 1. Update Student details (XP and level)
        update_student_xp_and_level(student_id, xp_earned, next_level)
        
        # 2. Add progress log record
        add_progress_record(student_id, level, correct_count, percentage, status)
        
        # 3. Add detailed quiz attempt
        add_quiz_attempt(student_id, level, correct_count, percentage, duration)
        
        # 4. Log activities
        log_student_activity(student_id, 'QUIZ_COMPLETE', f"Completed Level {level} quiz with score {correct_count}/{total_questions} ({percentage}%) in {duration}s")
        if level_unlocked:
            log_student_activity(student_id, 'LEVEL_UNLOCK', f"Unlocked Level {next_level}")
            
        return jsonify({
            'success': True,
            'totalQuestions': total_questions,
            'correctCount': correct_count,
            'wrongCount': total_questions - correct_count,
            'percentage': percentage,
            'status': status,
            'xpEarned': xp_earned,
            'levelUnlocked': level_unlocked or (current_level > level),
            'nextLevel': next_level or (level + 1),
            'correctAnswers': correct_answers
        })
        
    except Exception as e:
        print(f"Error grading quiz: {e}")
        return jsonify({'error': 'Failed to process quiz submission'}), 500

@quiz_bp.route('/class_quiz/<int:quiz_id>')
@login_required
def solve_class_quiz(quiz_id):
    student_id = session['student_id']
    quiz = get_class_quiz_by_id(quiz_id)
    if not quiz:
        return "Quiz not found", 404
        
    log_student_activity(student_id, 'CLASS_QUIZ_START', f"Started Class Quiz: {quiz['title']}")
    
    return render_template('class_quiz.html', quiz=quiz)

@quiz_bp.route('/api/submit_class_quiz/<int:quiz_id>', methods=['POST'])
@login_required
def submit_class_quiz(quiz_id):
    student_id = session['student_id']
    data = request.get_json() or {}
    user_answers = data.get('answers', [])
    
    quiz = get_class_quiz_by_id(quiz_id)
    if not quiz:
        return jsonify({'error': 'Quiz not found'}), 404
        
    try:
        questions = quiz['questions']
        total_questions = len(questions)
        
        if len(user_answers) < total_questions:
            return jsonify({'error': 'Missing answers'}), 400
            
        correct_count = 0
        correct_answers = [int(q['correct_answer']) for q in questions]
        
        for idx in range(total_questions):
            if int(user_answers[idx]) == correct_answers[idx]:
                correct_count += 1
                
        percentage = round((correct_count / total_questions) * 100)
        xp_earned = correct_count * 10
        
        # 1. Update Student XP
        update_student_xp_and_level(student_id, xp_earned)
        
        # 2. Record the Class Quiz attempt
        submit_class_quiz_attempt(quiz_id, student_id, correct_count, total_questions, user_answers)
        
        # 3. Log activity
        log_student_activity(student_id, 'CLASS_QUIZ_COMPLETE', f"Completed Class Quiz: {quiz['title']} with score {correct_count}/{total_questions} ({percentage}%)")
        
        return jsonify({
            'success': True,
            'totalQuestions': total_questions,
            'correctCount': correct_count,
            'wrongCount': total_questions - correct_count,
            'percentage': percentage,
            'xpEarned': xp_earned,
            'correctAnswers': correct_answers
        })
        
    except Exception as e:
        print(f"Error grading class quiz: {e}")
        return jsonify({'error': 'Failed to process class quiz submission'}), 500


