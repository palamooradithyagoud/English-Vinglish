import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase environment variables 'SUPABASE_URL' and 'SUPABASE_KEY' must be set in .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Helper function to parse database datetime strings safely
def parse_date(date_val):
    if not date_val:
        return datetime.now()
    if isinstance(date_val, datetime):
        return date_val
    try:
        # Handle ISO-8601 formatting from Supabase (e.g. UTC 'Z' or offset '+00:00')
        cleaned = date_val.replace('Z', '+00:00')
        return datetime.fromisoformat(cleaned)
    except Exception:
        try:
            return datetime.strptime(date_val.split('.')[0], "%Y-%m-%dT%H:%M:%S")
        except Exception:
            return datetime.now()

# Seed Level 1 Questions (Fallback dataset in case table is fresh/missing)
MOCK_QUESTIONS = [
    {
        "id": 1,
        "level": 1,
        "category": "VOCABULARY",
        "question": "Choose the correct meaning of the word 'ephemeral'.",
        "option_a": "Long-lasting and durable",
        "option_b": "Short-lived or lasting for a very short time",
        "option_c": "Extremely strong and powerful",
        "option_d": "Highly intellectual or academic",
        "correct_answer": 1
    },
    {
        "id": 2,
        "level": 1,
        "category": "VOCABULARY",
        "question": "A person who is quiet and reserves their thoughts or feelings is described as:",
        "option_a": "Loquacious",
        "option_b": "Reticent",
        "option_c": "Gregarious",
        "option_d": "Audacious",
        "correct_answer": 1
    },
    {
        "id": 3,
        "level": 1,
        "category": "VOCABULARY",
        "question": "Someone who actively supports or speaks in favor of a cause or policy is an:",
        "option_a": "Adversary",
        "option_b": "Advocate",
        "option_c": "Accomplice",
        "option_d": "Apprentice",
        "correct_answer": 1
    },
    {
        "id": 4,
        "level": 1,
        "category": "VOCABULARY",
        "question": "What is the meaning of the word 'meticulous'?",
        "option_a": "Showing great attention to detail; very precise",
        "option_b": "Careless, messy, and disorganized in work",
        "option_c": "Extremely fast-paced and energetic",
        "option_d": "Lacking energy, interest, or motivation",
        "correct_answer": 0
    },
    {
        "id": 5,
        "level": 1,
        "category": "SYNONYMS",
        "question": "What is a synonym for 'candid'?",
        "option_a": "Deceptive",
        "option_b": "Honest",
        "option_c": "Reluctant",
        "option_d": "Silent",
        "correct_answer": 1
    },
    {
        "id": 6,
        "level": 1,
        "category": "SYNONYMS",
        "question": "Identify the synonym of the word 'mitigate'.",
        "option_a": "Aggravate",
        "option_b": "Alleviate",
        "option_c": "Originate",
        "option_d": "Duplicate",
        "correct_answer": 1
    },
    {
        "id": 7,
        "level": 1,
        "category": "SYNONYMS",
        "question": "Choose the synonym of 'pragmatic'.",
        "option_a": "Idealistic",
        "option_b": "Practical",
        "option_c": "Inefficient",
        "option_d": "Impulsive",
        "correct_answer": 1
    },
    {
        "id": 8,
        "level": 1,
        "category": "SYNONYMS",
        "question": "Find the synonym of 'superfluous'.",
        "option_a": "Essential",
        "option_b": "Unnecessary",
        "option_c": "Insufficient",
        "option_d": "Temporary",
        "correct_answer": 1
    },
    {
        "id": 9,
        "level": 1,
        "category": "ANTONYMS",
        "question": "What is the antonym of the word 'obstinate'?",
        "option_a": "Stubborn",
        "option_b": "Flexible",
        "option_c": "Hostile",
        "option_d": "Rigid",
        "correct_answer": 1
    },
    {
        "id": 10,
        "level": 1,
        "category": "ANTONYMS",
        "question": "Select the antonym of the word 'benevolent'.",
        "option_a": "Malevolent",
        "option_b": "Generous",
        "option_c": "Friendly",
        "option_d": "Compassionate",
        "correct_answer": 0
    },
    {
        "id": 11,
        "level": 1,
        "category": "ANTONYMS",
        "question": "Choose the antonym of 'scarcity'.",
        "option_a": "Famine",
        "option_b": "Shortage",
        "option_c": "Abundance",
        "option_d": "Deficit",
        "correct_answer": 2
    },
    {
        "id": 12,
        "level": 1,
        "category": "ANTONYMS",
        "question": "What is the antonym of the word 'timid'?",
        "option_a": "Shy",
        "option_b": "Bold",
        "option_c": "Cautious",
        "option_d": "Humble",
        "correct_answer": 1
    },
    {
        "id": 13,
        "level": 1,
        "category": "ARTICLES",
        "question": "Fill in the blank: She is _______ honorable person who always tells the truth.",
        "option_a": "a",
        "option_b": "an",
        "option_c": "the",
        "option_d": "no article",
        "correct_answer": 1
    },
    {
        "id": 14,
        "level": 1,
        "category": "ARTICLES",
        "question": "Fill in the blank: I saw _______ European tourist looking at the map.",
        "option_a": "a",
        "option_b": "an",
        "option_c": "the",
        "option_d": "no article",
        "correct_answer": 0
    },
    {
        "id": 15,
        "level": 1,
        "category": "ARTICLES",
        "question": "Fill in the blank: Mount Everest is _______ tallest peak in the world.",
        "option_a": "a",
        "option_b": "an",
        "option_c": "the",
        "option_d": "no article",
        "correct_answer": 2
    },
    {
        "id": 16,
        "level": 1,
        "category": "ARTICLES",
        "question": "Fill in the blank: He wants to learn how to play _______ violin.",
        "option_a": "a",
        "option_b": "an",
        "option_c": "the",
        "option_d": "no article",
        "correct_answer": 2
    },
    {
        "id": 17,
        "level": 1,
        "category": "FILL IN THE BLANKS",
        "question": "Fill in the blank: Despite the heavy storm, the ship reached the harbor _______.",
        "option_a": "safely",
        "option_b": "safety",
        "option_c": "safe",
        "option_d": "safeness",
        "correct_answer": 0
    },
    {
        "id": 18,
        "level": 1,
        "category": "FILL IN THE BLANKS",
        "question": "Fill in the blank: If she _______ harder, she would have passed the exam last semester.",
        "option_a": "studies",
        "option_b": "will study",
        "option_c": "had studied",
        "option_d": "study",
        "correct_answer": 2
    },
    {
        "id": 19,
        "level": 1,
        "category": "FILL IN THE BLANKS",
        "question": "Fill in the blank: The committee has not _______ reached a final decision.",
        "option_a": "yet",
        "option_b": "already",
        "option_c": "still",
        "option_d": "since",
        "correct_answer": 0
    },
    {
        "id": 20,
        "level": 1,
        "category": "FILL IN THE BLANKS",
        "question": "Fill in the blank: Neither the teacher nor the students _______ present at the meeting.",
        "option_a": "was",
        "option_b": "were",
        "option_c": "is",
        "option_d": "are",
        "correct_answer": 1
    }
]

# ==========================================================================
# SUPABASE DATABASE API INTERFACE
# ==========================================================================

def get_student_by_email_or_roll(email_or_roll):
    """
    Search student database by email OR roll number in Supabase.
    """
    try:
        # Fetch matching record
        response = supabase.table("students") \
            .select("*") \
            .or_(f"email.eq.{email_or_roll},roll_number.eq.{email_or_roll}") \
            .execute()
        
        if response.data:
            student = response.data[0]
            # Standardize date values
            student['created_at'] = parse_date(student.get('created_at'))
            return student
        return None
    except Exception as e:
        print(f"Supabase get student error: {e}")
        return None

def get_student_by_id(student_id):
    """
    Retrieve student details using student ID from Supabase.
    """
    try:
        response = supabase.table("students").select("*").eq("id", student_id).execute()
        if response.data:
            student = response.data[0]
            student['created_at'] = parse_date(student.get('created_at'))
            return student
        return None
    except Exception as e:
        print(f"Supabase get student by id error: {e}")
        return None

def create_student(full_name, roll_number, branch, year, email, password_hash):
    """
    Insert a new student into your Supabase students table.
    """
    try:
        student_data = {
            'full_name': full_name,
            'roll_number': roll_number,
            'branch': branch,
            'year': int(year),
            'email': email,
            'password_hash': password_hash,
            'xp': 0,
            'current_level': 1
        }
        response = supabase.table("students").insert(student_data).execute()
        if response.data:
            student = response.data[0]
            student['created_at'] = parse_date(student.get('created_at'))
            return student
        raise Exception("Insert failed or returned empty data.")
    except Exception as e:
        print(f"Supabase create student error: {e}")
        raise e

def update_student_xp_and_level(student_id, xp_earned, new_level=None):
    """
    Increments student's XP score and updates level progress in Supabase.
    """
    try:
        # Fetch current record first to increment XP
        student = get_student_by_id(student_id)
        if not student:
            return None
            
        updated_xp = student.get('xp', 0) + xp_earned
        updates = {'xp': updated_xp}
        
        if new_level is not None:
            updates['current_level'] = max(student.get('current_level', 1), new_level)
            
        response = supabase.table("students").update(updates).eq("id", student_id).execute()
        if response.data:
            student = response.data[0]
            student['created_at'] = parse_date(student.get('created_at'))
            return student
        return None
    except Exception as e:
        print(f"Supabase update student progress error: {e}")
        return None

def get_levels_completed_count(student_id):
    """
    Find total unique levels passed by a student.
    """
    passed = get_all_passed_levels(student_id)
    return len(passed)

def get_recent_progress(student_id, limit=5):
    """
    Retrieve recent attempts logged by a student, ordered by completed_at DESC from Supabase.
    """
    try:
        response = supabase.table("progress") \
            .select("*") \
            .eq("student_id", student_id) \
            .order("completed_at", desc=True) \
            .limit(limit) \
            .execute()
            
        records = response.data or []
        for r in records:
            r['completed_at'] = parse_date(r.get('completed_at'))
        return records
    except Exception as e:
        print(f"Supabase get progress error: {e}")
        return []

def add_progress_record(student_id, level, score, percentage, status):
    """
    Logs quiz completion details to the progress table in Supabase.
    """
    try:
        record = {
            'student_id': student_id,
            'level': int(level),
            'score': int(score),
            'percentage': int(percentage),
            'status': status
        }
        response = supabase.table("progress").insert(record).execute()
        if response.data:
            res_record = response.data[0]
            res_record['completed_at'] = parse_date(res_record.get('completed_at'))
            return res_record
        raise Exception("Insert progress failed.")
    except Exception as e:
        print(f"Supabase add progress error: {e}")
        raise e

def get_questions_for_level(level):
    """
    Retrieve questions belonging to a particular level from Supabase.
    If the table is empty/missing, falls back to the in-memory dataset to ensure uptime.
    """
    try:
        response = supabase.table("questions") \
            .select("*") \
            .eq("level", int(level)) \
            .order("id", desc=False) \
            .execute()
            
        if response.data:
            return response.data
            
        # Try to seed if table exists but has no data
        try:
            # Format questions removing 'id' to let database generate serial keys
            seed_data = []
            for q in MOCK_QUESTIONS:
                seed_item = q.copy()
                if 'id' in seed_item:
                    del seed_item['id']
                seed_data.append(seed_item)
                
            supabase.table("questions").insert(seed_data).execute()
            # Refetch
            refetch = supabase.table("questions").select("*").eq("level", int(level)).order("id", desc=False).execute()
            if refetch.data:
                return refetch.data
        except Exception as seed_err:
            print(f"Auto-seeding questions failed: {seed_err}")
            
        return [q for q in MOCK_QUESTIONS if q['level'] == int(level)]
    except Exception as e:
        print(f"Supabase fetch questions error: {e}. Falling back to local questions.")
        return [q for q in MOCK_QUESTIONS if q['level'] == int(level)]

def get_all_passed_levels(student_id):
    """
    Returns a set of level numbers that the student completed with 'passed' status in Supabase.
    """
    try:
        response = supabase.table("progress") \
            .select("level") \
            .eq("student_id", student_id) \
            .eq("status", "passed") \
            .execute()
            
        if response.data:
            return {r['level'] for r in response.data}
        return set()
    except Exception as e:
        print(f"Supabase get passed levels error: {e}")
        return set()
