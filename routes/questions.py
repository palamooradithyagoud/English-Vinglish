from flask import Blueprint, render_template, request, redirect, url_for, flash
from database import (
    get_all_questions,
    get_question_by_id,
    create_question,
    update_question,
    delete_question
)
from routes.faculty_auth import faculty_login_required

questions_bp = Blueprint('questions', __name__)

@questions_bp.route('/faculty/questions')
@faculty_login_required
def list_questions():
    level_filter = request.args.get('level', 'All')
    search_query = request.args.get('search', '')
    
    questions_list = get_all_questions(
        search_query=search_query,
        level=None if level_filter == 'All' else level_filter
    )
    
    levels = [1, 2, 3, 4, 5]
    categories = [
        'VOCABULARY', 'SYNONYMS', 'ANTONYMS', 'ARTICLES', 'FILL IN THE BLANKS', 'GRAMMAR',
        'TENSES', 'ERROR DETECTION', 'SENTENCE REARRANGEMENT', 'PREPOSITIONS', 'CONJUNCTIONS', 'READING COMPREHENSION'
    ]
    
    return render_template(
        'faculty/questions.html',
        questions=questions_list,
        selected_level=level_filter,
        search_query=search_query,
        levels=levels,
        categories=categories
    )

@questions_bp.route('/faculty/questions/add', methods=['POST'])
@faculty_login_required
def add_question():
    level = request.form.get('level')
    category = request.form.get('category')
    question = request.form.get('question', '').strip()
    option_a = request.form.get('option_a', '').strip()
    option_b = request.form.get('option_b', '').strip()
    option_c = request.form.get('option_c', '').strip()
    option_d = request.form.get('option_d', '').strip()
    correct_answer = request.form.get('correct_answer')
    
    if not (level and category and question and option_a and option_b and option_c and option_d and correct_answer):
        flash("All fields are required to add a question.", "error")
        return redirect(url_for('questions.list_questions'))
        
    try:
        create_question(level, category, question, option_a, option_b, option_c, option_d, correct_answer)
        flash("Question added successfully!", "success")
    except Exception as e:
        flash(f"Error adding question: {e}", "error")
        
    return redirect(url_for('questions.list_questions'))

@questions_bp.route('/faculty/questions/edit/<int:question_id>', methods=['POST'])
@faculty_login_required
def edit_question(question_id):
    level = request.form.get('level')
    category = request.form.get('category')
    question = request.form.get('question', '').strip()
    option_a = request.form.get('option_a', '').strip()
    option_b = request.form.get('option_b', '').strip()
    option_c = request.form.get('option_c', '').strip()
    option_d = request.form.get('option_d', '').strip()
    correct_answer = request.form.get('correct_answer')
    
    if not (level and category and question and option_a and option_b and option_c and option_d and correct_answer):
        flash("All fields are required to update a question.", "error")
        return redirect(url_for('questions.list_questions'))
        
    try:
        update_question(question_id, level, category, question, option_a, option_b, option_c, option_d, correct_answer)
        flash("Question updated successfully!", "success")
    except Exception as e:
        flash(f"Error updating question: {e}", "error")
        
    return redirect(url_for('questions.list_questions'))

@questions_bp.route('/faculty/questions/delete/<int:question_id>', methods=['POST'])
@faculty_login_required
def remove_question(question_id):
    try:
        success = delete_question(question_id)
        if success:
            flash("Question deleted successfully.", "success")
        else:
            flash("Failed to delete question.", "error")
    except Exception as e:
        flash(f"Error deleting question: {e}", "error")
        
    return redirect(url_for('questions.list_questions'))
