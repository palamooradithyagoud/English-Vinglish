from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_student_by_email_or_roll, create_student, log_student_activity
import functools

auth_bp = Blueprint('auth', __name__)

# Authentication Decorator
def login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if 'student_id' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('auth.login'))
        return view(**kwargs)
    return wrapped_view

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if 'student_id' in session:
        return redirect(url_for('dashboard.home'))
        
    if request.method == 'POST':
        full_name = request.form.get('full_name', '').strip()
        roll_number = request.form.get('roll_number', '').strip()
        branch = request.form.get('branch', '').strip()
        year = request.form.get('year', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        # Validations
        errors = []
        if not (full_name and roll_number and branch and year and email and password and confirm_password):
            errors.append("All fields are required.")
            
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long.")
            
        if password != confirm_password:
            errors.append("Passwords do not match.")
            
        try:
            year_int = int(year)
            if year_int < 1 or year_int > 5:
                errors.append("Year must be between 1 and 5.")
        except ValueError:
            errors.append("Year must be a number.")
            
        if errors:
            for error in errors:
                flash(error, 'error')
            return render_template('register.html')
            
        try:
            # Check unique email
            existing_email = get_student_by_email_or_roll(email)
            if existing_email:
                flash("Email already registered.", 'error')
                return render_template('register.html')
                
            # Check unique roll number
            existing_roll = get_student_by_email_or_roll(roll_number)
            if existing_roll:
                flash("Roll Number already registered.", 'error')
                return render_template('register.html')
                
            # Create user in-memory
            password_hash = generate_password_hash(password)
            create_student(full_name, roll_number, branch, year_int, email, password_hash)
            
            flash("Registration successful! Please log in.", "success")
            return redirect(url_for('auth.login'))
            
        except Exception as e:
            flash(f"An error occurred during registration: {e}", 'error')
            return render_template('register.html')
            
    return render_template('register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if 'student_id' in session:
        return redirect(url_for('dashboard.home'))
        
    if request.method == 'POST':
        email_or_roll = request.form.get('email_or_roll', '').strip()
        password = request.form.get('password', '')
        
        if not (email_or_roll and password):
            flash("Please enter both credentials.", "error")
            return render_template('login.html', active_tab='student')
            
        try:
            student = get_student_by_email_or_roll(email_or_roll)
            
            if student:
                if check_password_hash(student['password_hash'], password):
                    session['student_id'] = student['id']
                    session['student_name'] = student['full_name']
                    session['show_greeting'] = True
                    log_student_activity(student['id'], 'LOGIN', f"Student {student['full_name']} logged in successfully")
                    flash(f"Welcome back, {student['full_name']}!", "success")
                    return redirect(url_for('dashboard.home'))
            
            flash("Invalid email/roll number or password.", "error")
        except Exception as e:
            flash(f"An error occurred during login: {e}", 'error')
            
    return render_template('login.html', active_tab='student')

@auth_bp.route('/logout')
def logout():
    student_id = session.get('student_id')
    student_name = session.get('student_name', 'Student')
    if student_id:
        log_student_activity(student_id, 'LOGOUT', f"Student {student_name} logged out")
    session.clear()
    flash("You have been logged out.", "success")
    return redirect(url_for('auth.login'))
