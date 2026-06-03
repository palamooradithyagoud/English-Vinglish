from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from werkzeug.security import check_password_hash
from database import get_faculty_by_email_or_emp_id
import functools

faculty_auth_bp = Blueprint('faculty_auth', __name__)

def faculty_login_required(view):
    """
    Decorator to protect routes from unauthenticated faculty access.
    """
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if 'faculty_id' not in session:
            flash('Please log in as faculty to access this page.', 'warning')
            return redirect(url_for('faculty_auth.login'))
        return view(**kwargs)
    return wrapped_view

@faculty_auth_bp.route('/faculty/login', methods=['GET', 'POST'])
def login():
    if 'faculty_id' in session:
        return redirect(url_for('faculty_dashboard.dashboard'))
        
    if request.method == 'POST':
        email_or_emp = request.form.get('email_or_emp', '').strip()
        password = request.form.get('password', '')
        
        if not (email_or_emp and password):
            flash("Please enter both credentials.", "error")
            return render_template('login.html', active_tab='faculty')
            
        try:
            faculty = get_faculty_by_email_or_emp_id(email_or_emp)
            
            if faculty:
                if check_password_hash(faculty['password_hash'], password):
                    session['faculty_id'] = faculty['id']
                    session['faculty_name'] = faculty['name']
                    flash(f"Welcome back, Prof. {faculty['name']}!", "success")
                    return redirect(url_for('faculty_dashboard.dashboard'))
            
            flash("Invalid email/employee ID or password.", "error")
        except Exception as e:
            flash(f"An error occurred during login: {e}", 'error')
            
    return render_template('login.html', active_tab='faculty')

@faculty_auth_bp.route('/faculty/logout')
def logout():
    session.pop('faculty_id', None)
    session.pop('faculty_name', None)
    flash("You have been logged out as faculty.", "success")
    return redirect(url_for('faculty_auth.login'))
