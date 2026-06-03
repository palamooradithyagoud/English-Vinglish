from flask import Blueprint, render_template, jsonify, request, session
from database import (
    get_student_by_id, 
    get_questions_for_level, 
    update_student_xp_and_level, 
    add_progress_record
)
from routes.auth import login_required

quiz_bp = Blueprint('quiz', __name__)

@quiz_bp.route('/quiz')
@login_required
def quiz_page():
    return render_template('quiz.html')

@quiz_bp.route('/api/questions')
@login_required
def get_questions():
    try:
        # Fetch Level 1 questions from in-memory datastore
        db_questions = get_questions_for_level(1)
        
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
        # Fetch original questions to grade
        db_questions = get_questions_for_level(1)
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
        
        # Get active level details
        student = get_student_by_id(student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404
            
        current_level = student['current_level']
        
        # Determine level unlocks
        next_level = None
        level_unlocked = False
        if has_passed and current_level == 1:
            next_level = 2
            level_unlocked = True
            
        # 1. Update Student details (XP and level in-memory)
        update_student_xp_and_level(student_id, xp_earned, next_level)
        
        # 2. Add progress log record
        add_progress_record(student_id, 1, correct_count, percentage, status)
        
        return jsonify({
            'success': True,
            'totalQuestions': total_questions,
            'correctCount': correct_count,
            'wrongCount': total_questions - correct_count,
            'percentage': percentage,
            'status': status,
            'xpEarned': xp_earned,
            'levelUnlocked': level_unlocked or (current_level >= 2),
            'correctAnswers': correct_answers
        })
        
    except Exception as e:
        print(f"Error grading quiz: {e}")
        return jsonify({'error': 'Failed to process quiz submission'}), 500
