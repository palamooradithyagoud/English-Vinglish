import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

class Config:
    # Secret key for sessions
    SECRET_KEY = os.environ.get('SECRET_KEY', 'duolingo-english-basics-secret-key-123456')
    
    # Supabase / PostgreSQL database URI connection string
    # E.g., postgresql://postgres:password@db.supabase.co:5432/postgres
    DATABASE_URL = os.environ.get('DATABASE_URL')
    
    # Flask session configs
    SESSION_COOKIE_NAME = 'student_session'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
