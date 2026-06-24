from flask import Flask
from config import Config
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.faculty_auth import faculty_auth_bp
from routes.faculty_dashboard import faculty_dashboard_bp
from routes.questions import questions_bp
from routes.reports import reports_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(faculty_auth_bp)
    app.register_blueprint(faculty_dashboard_bp)
    app.register_blueprint(questions_bp)
    @app.context_processor
    def inject_student_global():
        from flask import session
        from database import get_student_by_id
        if 'student_id' in session:
            student = get_student_by_id(session['student_id'])
            if student:
                from routes.dashboard import calculate_streak
                streak = calculate_streak(session['student_id'])
                student['streak'] = streak
                return {'student': student, 'student_streak': streak}
        return {'student': None, 'student_streak': 0}
        
    return app

app = create_app()

if __name__ == '__main__':
    # Run Flask local server on port 3000
    app.run(host='127.0.0.1', port=3000, debug=True)
