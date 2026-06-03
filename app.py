from flask import Flask
from config import Config
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.quiz import quiz_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(quiz_bp)
    
    return app

app = create_app()

if __name__ == '__main__':
    # Run Flask local server on port 3000
    app.run(host='127.0.0.1', port=3000, debug=True)
