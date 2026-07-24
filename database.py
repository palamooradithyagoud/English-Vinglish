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

# ==========================================================================
# THREAD-SAFE LOCAL TTL CACHES & INVALIDATION HELPERS
# ==========================================================================
from threading import Lock
import time

_student_cache = {}
_student_cache_lock = Lock()

_activity_logs_cache = {}
_activity_logs_cache_lock = Lock()

_passed_levels_cache = {}
_passed_levels_cache_lock = Lock()

CACHE_TTL = 15  # Cache TTL in seconds

def invalidate_student_cache(student_id):
    student_id_str = str(student_id)
    with _student_cache_lock:
        if student_id_str in _student_cache:
            del _student_cache[student_id_str]

def invalidate_student_activity_logs_cache(student_id):
    student_id_str = str(student_id)
    with _activity_logs_cache_lock:
        keys_to_remove = [k for k in _activity_logs_cache.keys() if k.startswith(student_id_str + "_")]
        for k in keys_to_remove:
            del _activity_logs_cache[k]

def invalidate_passed_levels_cache(student_id):
    student_id_str = str(student_id)
    with _passed_levels_cache_lock:
        if student_id_str in _passed_levels_cache:
            del _passed_levels_cache[student_id_str]

def invalidate_all_student_caches(student_id):
    invalidate_student_cache(student_id)
    invalidate_student_activity_logs_cache(student_id)
    invalidate_passed_levels_cache(student_id)

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

# Fallback questions are no longer stored locally. All questions are queried from Supabase.

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

def get_student_by_id(student_id, force_fresh=False):
    """
    Retrieve student details using student ID from Supabase with caching.
    """
    now = time.time()
    student_id_str = str(student_id)
    
    if not force_fresh:
        with _student_cache_lock:
            if student_id_str in _student_cache:
                timestamp, student = _student_cache[student_id_str]
                if now - timestamp < CACHE_TTL:
                    return student.copy() if student else None
                    
    try:
        response = supabase.table("students").select("*").eq("id", student_id).execute()
        if response.data:
            student = response.data[0]
            student['created_at'] = parse_date(student.get('created_at'))
        else:
            student = None
            
        with _student_cache_lock:
            _student_cache[student_id_str] = (now, student)
            
        return student.copy() if student else None
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
        student = get_student_by_id(student_id, force_fresh=True)
        if not student:
            return None
            
        updated_xp = student.get('xp', 0) + xp_earned
        updates = {'xp': updated_xp}
        
        # Calculate level based on XP thresholds
        calculated_level = 1
        if updated_xp >= 1000:
            calculated_level = 5
        elif updated_xp >= 500:
            calculated_level = 4
        elif updated_xp >= 250:
            calculated_level = 3
        elif updated_xp >= 100:
            calculated_level = 2
            
        final_level = max(student.get('current_level', 1), calculated_level)
        if new_level is not None:
            final_level = max(final_level, new_level)
            
        updates['current_level'] = final_level
            
        response = supabase.table("students").update(updates).eq("id", student_id).execute()
        if response.data:
            student = response.data[0]
            student['created_at'] = parse_date(student.get('created_at'))
            invalidate_student_cache(student_id)
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
            invalidate_passed_levels_cache(student_id)
            invalidate_student_activity_logs_cache(student_id)
            return res_record
        raise Exception("Insert progress failed.")
    except Exception as e:
        print(f"Supabase add progress error: {e}")
        raise e

def get_questions_for_level(level):
    """
    Retrieve questions belonging to a particular level from Supabase.
    """
    try:
        response = supabase.table("questions") \
            .select("*") \
            .eq("level", int(level)) \
            .order("id", desc=False) \
            .execute()
            
        return response.data or []
    except Exception as e:
        print(f"Supabase fetch questions error: {e}")
        return []

def get_all_passed_levels(student_id):
    """
    Returns a set of level numbers that the student completed with 'passed' status in Supabase with caching.
    """
    now = time.time()
    student_id_str = str(student_id)
    
    with _passed_levels_cache_lock:
        if student_id_str in _passed_levels_cache:
            timestamp, passed_set = _passed_levels_cache[student_id_str]
            if now - timestamp < CACHE_TTL:
                return passed_set.copy()
                
    try:
        response = supabase.table("progress") \
            .select("level") \
            .eq("student_id", student_id) \
            .eq("status", "passed") \
            .execute()
            
        if response.data:
            passed_set = {r['level'] for r in response.data}
        else:
            passed_set = set()
            
        with _passed_levels_cache_lock:
            _passed_levels_cache[student_id_str] = (now, passed_set)
            
        return passed_set.copy()
    except Exception as e:
        print(f"Supabase get passed levels error: {e}")
        return set()


# ==========================================================================
# PHASE 3: FACULTY MANAGEMENT AND ANALYTICS FUNCTIONS
# ==========================================================================

def get_faculty_by_email_or_emp_id(email_or_emp_id):
    """
    Retrieve faculty details using email OR employee ID from Supabase.
    """
    try:
        response = supabase.table("faculty") \
            .select("*") \
            .or_(f"email.eq.{email_or_emp_id},employee_id.eq.{email_or_emp_id}") \
            .execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Supabase get faculty error: {e}")
        return None

def create_faculty(employee_id, name, email, password_hash, department):
    """
    Insert a new faculty member into Supabase.
    """
    try:
        data = {
            "employee_id": employee_id,
            "name": name,
            "email": email,
            "password_hash": password_hash,
            "department": department
        }
        response = supabase.table("faculty").insert(data).execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Supabase create faculty error: {e}")
        raise e

def seed_default_faculty():
    """
    Seeds a default faculty member (faculty@college.edu / faculty123) if none exist.
    """
    try:
        response = supabase.table("faculty").select("id").limit(1).execute()
        if not response.data:
            from werkzeug.security import generate_password_hash
            default_faculty = {
                "employee_id": "FAC001",
                "name": "Default Faculty",
                "email": "faculty@college.edu",
                "password_hash": generate_password_hash("faculty123"),
                "department": "English Language"
            }
            supabase.table("faculty").insert(default_faculty).execute()
            print("Successfully seeded default faculty member: faculty@college.edu / faculty123")
    except Exception as e:
        print(f"Error seeding default faculty: {e}")

# Run the seeding dynamically when database is loaded
seed_default_faculty()

def get_total_students_count():
    """
    Returns the total count of registered students.
    """
    try:
        response = supabase.table("students").select("id", count="exact").execute()
        if hasattr(response, "count") and response.count is not None:
            return response.count
        return len(response.data) if response.data else 0
    except Exception as e:
        print(f"Error getting total student count: {e}")
        return 0

def get_active_students_count():
    """
    Returns the number of students active in the last 7 days (based on activity logs).
    """
    try:
        from datetime import datetime, timedelta
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        seven_days_ago_iso = seven_days_ago.isoformat()
        
        response = supabase.table("activity_logs") \
            .select("student_id") \
            .gte("created_at", seven_days_ago_iso) \
            .execute()
            
        if response.data:
            student_ids = {item["student_id"] for item in response.data}
            return len(student_ids)
        return 0
    except Exception as e:
        print(f"Error getting active student count: {e}")
        return 0

def get_average_quiz_accuracy():
    """
    Calculates average accuracy across all quiz attempts. Fallbacks to progress table if empty.
    """
    try:
        response = supabase.table("quiz_attempts").select("percentage").execute()
        if response.data:
            percentages = [r["percentage"] for r in response.data]
            return round(sum(percentages) / len(percentages), 1)
            
        # Fallback to progress
        response_prog = supabase.table("progress").select("percentage").execute()
        if response_prog.data:
            percentages = [r["percentage"] for r in response_prog.data]
            return round(sum(percentages) / len(percentages), 1)
            
        return 0.0
    except Exception as e:
        print(f"Error getting average quiz accuracy: {e}")
        return 0.0

def get_total_quiz_attempts():
    """
    Returns total number of quiz attempts. Fallbacks to progress table if empty.
    """
    try:
        response = supabase.table("quiz_attempts").select("id", count="exact").execute()
        count = response.count if hasattr(response, "count") and response.count is not None else (len(response.data) if response.data else 0)
        
        if count == 0:
            response_prog = supabase.table("progress").select("id", count="exact").execute()
            count = response_prog.count if hasattr(response_prog, "count") and response_prog.count is not None else (len(response_prog.data) if response_prog.data else 0)
            
        return count
    except Exception as e:
        print(f"Error getting total quiz attempts: {e}")
        return 0

def get_total_levels_completed_count():
    """
    Returns count of unique level completions across all students.
    """
    try:
        response = supabase.table("progress") \
            .select("student_id,level") \
            .eq("status", "passed") \
            .execute()
        if response.data:
            completions = {(r["student_id"], r["level"]) for r in response.data}
            return len(completions)
        return 0
    except Exception as e:
        print(f"Error getting total levels completed: {e}")
        return 0

def get_top_performing_student():
    """
    Returns student with highest XP.
    """
    try:
        response = supabase.table("students") \
            .select("*") \
            .order("xp", desc=True) \
            .limit(1) \
            .execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error getting top performing student: {e}")
        return None

def get_students_list(branch=None, year=None, level=None, search_query=None):
    """
    Retrieve filterable, searchable student list.
    """
    try:
        query = supabase.table("students").select("*")
        if branch and branch != "All":
            query = query.eq("branch", branch)
        if year and year != "All":
            query = query.eq("year", int(year))
        if level and level != "All":
            query = query.eq("current_level", int(level))
        
        response = query.execute()
        students = response.data or []
        
        if search_query:
            search_query = search_query.lower().strip()
            filtered = []
            for s in students:
                name_match = search_query in s.get("full_name", "").lower()
                roll_match = search_query in s.get("roll_number", "").lower()
                email_match = search_query in s.get("email", "").lower()
                if name_match or roll_match or email_match:
                    filtered.append(s)
            students = filtered
            
        # Sort by name
        students = sorted(students, key=lambda x: x.get("full_name", "").lower())
        
        for s in students:
            s["created_at"] = parse_date(s.get("created_at"))
        return students
    except Exception as e:
        print(f"Error getting students list: {e}")
        return []

def get_all_students_progress():
    """
    Retrieve all students with detailed progress info:
    - levels_completed
    - progress_percentage
    - last_active
    - streak
    - speaking_stats
    - game_stats
    """
    try:
        students = get_students_list()
        
        # 1. Fetch all progress records
        prog_resp = supabase.table("progress").select("student_id,level,status,completed_at").execute()
        progress_records = prog_resp.data or []
        
        from collections import defaultdict
        student_prog = defaultdict(list)
        for r in progress_records:
            student_prog[r["student_id"]].append(r)
            
        # 2. Fetch all activity logs to calculate streak and last active
        logs_resp = supabase.table("activity_logs") \
            .select("student_id,created_at") \
            .order("created_at", desc=True) \
            .execute()
        logs_records = logs_resp.data or []
        
        student_logs = defaultdict(list)
        for r in logs_records:
            student_logs[r["student_id"]].append(r)
            
        # 3. Fetch all speaking attempts
        speaking_resp = supabase.table("speaking_attempts").select("*").execute()
        speaking_records = speaking_resp.data or []
        
        student_speaking = defaultdict(list)
        for r in speaking_records:
            student_speaking[r["student_id"]].append(r)
            
        # 4. Fetch all game attempts
        game_resp = supabase.table("game_attempts").select("*").execute()
        game_records = game_resp.data or []
        
        student_games = defaultdict(list)
        for r in game_records:
            student_games[r["student_id"]].append(r)
            
        # Enrich student data
        from datetime import datetime, timedelta
        today = datetime.utcnow().date()
        yesterday = today - timedelta(days=1)
        
        for s in students:
            s_id = s["id"]
            
            # Progress levels
            records = student_prog.get(s_id, [])
            passed = {r["level"] for r in records if r["status"] == "passed"}
            s["levels_completed"] = len(passed)
            s["progress_percentage"] = min(100, len(passed) * 20)
            
            # Streak calculation
            logs = student_logs.get(s_id, [])
            last_act = None
            streak = 0
            if logs:
                last_act = parse_date(logs[0]["created_at"])
                
                # Extract unique dates, sorted descending
                unique_dates = sorted(list({parse_date(l['created_at']).date() for l in logs}), reverse=True)
                if unique_dates:
                    # Check if streak is active
                    if unique_dates[0] in (today, yesterday):
                        streak = 1
                        current_date = unique_dates[0]
                        for next_date in unique_dates[1:]:
                            if (current_date - next_date).days == 1:
                                streak += 1
                                current_date = next_date
                            elif (current_date - next_date).days == 0:
                                continue
                            else:
                                break
            s["streak"] = streak
            
            # Determine last active date
            if not last_act and records:
                sorted_r = sorted(records, key=lambda x: x.get("completed_at", ""), reverse=True)
                last_act = parse_date(sorted_r[0]["completed_at"])
                
            if last_act:
                s["last_active"] = last_act.strftime("%Y-%m-%d %H:%M")
            else:
                s["last_active"] = "No activity"
                
            # Speaking stats
            speaking_list = student_speaking.get(s_id, [])
            if speaking_list:
                total_xp = sum(a.get("earned_xp", 0) for a in speaking_list)
                total_sessions = len(speaking_list)
                average_accuracy = int(sum(a.get("accuracy", 0) for a in speaking_list) / total_sessions)
                average_pron = int(sum(a.get("pronunciation", 0) for a in speaking_list) / total_sessions)
                average_fluency = int(sum(a.get("fluency", 0) for a in speaking_list) / total_sessions)
                s["speaking_stats"] = {
                    "total_xp": total_xp,
                    "total_sessions": total_sessions,
                    "average_accuracy": average_accuracy,
                    "average_pron": average_pron,
                    "average_fluency": average_fluency
                }
            else:
                s["speaking_stats"] = {
                    "total_xp": 0,
                    "total_sessions": 0,
                    "average_accuracy": 0,
                    "average_pron": 0,
                    "average_fluency": 0
                }
                
            # Game stats
            games_list = student_games.get(s_id, [])
            if games_list:
                total_xp = sum(a.get("earned_xp", 0) for a in games_list)
                total_plays = len(games_list)
                high_score = max(a.get("score", 0) for a in games_list)
                max_streak = max(a.get("streak", 0) for a in games_list)
                s["game_stats"] = {
                    "total_xp": total_xp,
                    "total_plays": total_plays,
                    "high_score": high_score,
                    "max_streak": max_streak
                }
            else:
                s["game_stats"] = {
                    "total_xp": 0,
                    "total_plays": 0,
                    "high_score": 0,
                    "max_streak": 0
                }
                
        return students
    except Exception as e:
        print(f"Error getting all students progress: {e}")
        return []

def get_student_quiz_accuracy_trend(student_id):
    """
    Gets quiz percentages in chronological order for Chart.js.
    """
    try:
        response = supabase.table("quiz_attempts") \
            .select("percentage,completed_at,level") \
            .eq("student_id", student_id) \
            .order("completed_at", desc=False) \
            .execute()
            
        records = response.data or []
        if not records:
            response_prog = supabase.table("progress") \
                .select("percentage,completed_at,level") \
                .eq("student_id", student_id) \
                .order("completed_at", desc=False) \
                .execute()
            records = response_prog.data or []
            
        data = []
        for idx, r in enumerate(records):
            dt = parse_date(r.get("completed_at"))
            data.append({
                "label": f"L{r.get('level')} Q{idx+1}",
                "percentage": r.get("percentage"),
                "date": dt.strftime("%Y-%m-%d")
            })
        return data
    except Exception as e:
        print(f"Error getting student accuracy trend: {e}")
        return []

def get_student_xp_growth(student_id):
    """
    Gets cumulative XP growth over time.
    """
    try:
        response = supabase.table("progress") \
            .select("score,completed_at") \
            .eq("student_id", student_id) \
            .order("completed_at", desc=False) \
            .execute()
            
        records = response.data or []
        xp_growth = []
        cumulative_xp = 0
        for r in records:
            dt = parse_date(r.get("completed_at"))
            earned = r.get("score", 0) * 10
            cumulative_xp += earned
            xp_growth.append({
                "date": dt.strftime("%Y-%m-%d"),
                "xp": cumulative_xp
            })
        return xp_growth
    except Exception as e:
        print(f"Error getting student XP growth: {e}")
        return []

def get_student_weekly_activity(student_id):
    """
    Gets activity count for last 7 days, grouped by day.
    """
    try:
        from datetime import datetime, timedelta
        import calendar
        
        days = list(calendar.day_name)
        counts = {day: 0 for day in days}
        
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        response = supabase.table("activity_logs") \
            .select("created_at") \
            .eq("student_id", student_id) \
            .gte("created_at", seven_days_ago.isoformat()) \
            .execute()
            
        records = response.data or []
        for r in records:
            dt = parse_date(r.get("created_at"))
            day_name = dt.strftime("%A")
            if day_name in counts:
                counts[day_name] += 1
                
        return [{"day": day, "count": counts[day]} for day in days]
    except Exception as e:
        print(f"Error getting student weekly activity: {e}")
        return []

def get_student_level_completions(student_id):
    """
    Gets list of completed levels for student detail.
    """
    try:
        response = supabase.table("progress") \
            .select("*") \
            .eq("student_id", student_id) \
            .eq("status", "passed") \
            .order("completed_at", desc=False) \
            .execute()
            
        records = response.data or []
        for r in records:
            r["completed_at"] = parse_date(r.get("completed_at"))
        return records
    except Exception as e:
        print(f"Error getting student level completions: {e}")
        return []

def create_question(level, category, question, option_a, option_b, option_c, option_d, correct_answer):
    """
    Insert a new question into Supabase.
    """
    try:
        data = {
            "level": int(level),
            "category": category,
            "question": question,
            "option_a": option_a,
            "option_b": option_b,
            "option_c": option_c,
            "option_d": option_d,
            "correct_answer": int(correct_answer)
        }
        response = supabase.table("questions").insert(data).execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error creating question: {e}")
        raise e

def update_question(question_id, level, category, question, option_a, option_b, option_c, option_d, correct_answer):
    """
    Update an existing question in Supabase.
    """
    try:
        data = {
            "level": int(level),
            "category": category,
            "question": question,
            "option_a": option_a,
            "option_b": option_b,
            "option_c": option_c,
            "option_d": option_d,
            "correct_answer": int(correct_answer)
        }
        response = supabase.table("questions").update(data).eq("id", int(question_id)).execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error updating question: {e}")
        raise e

def delete_question(question_id):
    """
    Delete a question from Supabase.
    """
    try:
        response = supabase.table("questions").delete().eq("id", int(question_id)).execute()
        return True
    except Exception as e:
        print(f"Error deleting question: {e}")
        return False

def get_question_by_id(question_id):
    """
    Retrieve a single question by its ID.
    """
    try:
        response = supabase.table("questions").select("*").eq("id", int(question_id)).execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error getting question by id: {e}")
        return None

def get_all_questions(search_query=None, level=None):
    """
    Get all questions, with optional search and level filter.
    """
    try:
        query = supabase.table("questions").select("*")
        if level and level != "All":
            query = query.eq("level", int(level))
        response = query.execute()
        questions = response.data or []
        
        if search_query:
            search_query = search_query.lower().strip()
            filtered = []
            for q in questions:
                q_text = q.get("question", "").lower()
                q_cat = q.get("category", "").lower()
                if search_query in q_text or search_query in q_cat:
                    filtered.append(q)
            questions = filtered
            
        return sorted(questions, key=lambda x: x.get("id", 0))
    except Exception as e:
        print(f"Error getting all questions: {e}")
        return []

def detect_weak_students():
    """
    Identify students with:
      - Average accuracy < 50%
      - No activity in last 7 days
      - Failed a level quiz >= 3 times
    """
    try:
        students = get_students_list()
        if not students:
            return []
            
        # 1. Fetch all progress records in a single query
        progress_resp = supabase.table("progress") \
            .select("student_id,percentage,status,level,completed_at") \
            .execute()
        progress_data = progress_resp.data or []
        
        # Group progress records by student_id
        from collections import defaultdict
        student_progress = defaultdict(list)
        for r in progress_data:
            student_progress[r["student_id"]].append(r)
            
        # 2. Fetch all activity logs in a single query
        logs_resp = supabase.table("activity_logs") \
            .select("student_id,created_at") \
            .order("created_at", desc=True) \
            .execute()
        logs_data = logs_resp.data or []
        
        # Group activity logs by student_id to find the latest activity
        student_latest_log = {}
        for log in logs_data:
            sid = log["student_id"]
            if sid not in student_latest_log:
                student_latest_log[sid] = parse_date(log["created_at"])
                
        # Now process each student
        weak_students = []
        from datetime import datetime, timedelta
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        for student in students:
            student_id = student["id"]
            reasons = []
            
            attempts = student_progress.get(student_id, [])
            
            # 1. Average accuracy < 50%
            if attempts:
                pcts = [a["percentage"] for a in attempts]
                avg_pct = sum(pcts) / len(pcts)
                if avg_pct < 50:
                    reasons.append(f"Low average accuracy ({round(avg_pct, 1)}%)")
            
            # 2. Inactive for last 7 days
            last_activity = student_latest_log.get(student_id)
            if not last_activity:
                # Fallback to latest progress completion time if no activity logs
                if attempts:
                    sorted_attempts = sorted(attempts, key=lambda x: x.get("completed_at", ""), reverse=True)
                    last_activity = parse_date(sorted_attempts[0]["completed_at"])
            
            if last_activity:
                if last_activity.replace(tzinfo=None) < seven_days_ago:
                    days_inactive = (datetime.utcnow() - last_activity.replace(tzinfo=None)).days
                    reasons.append(f"Inactive for {days_inactive} days")
            else:
                reasons.append("No active logs recorded")
                
            # 3. Failed a quiz level >= 3 times
            if attempts:
                fail_counts = {}
                for a in attempts:
                    if a["status"] == "failed":
                        lvl = a["level"]
                        fail_counts[lvl] = fail_counts.get(lvl, 0) + 1
                for lvl, cnt in fail_counts.items():
                    if cnt >= 3:
                        reasons.append(f"Failed Level {lvl} quiz {cnt} times")
                        
            if reasons:
                weak_students.append({
                    "id": student["id"],
                    "full_name": student["full_name"],
                    "roll_number": student["roll_number"],
                    "branch": student["branch"],
                    "year": student["year"],
                    "reasons": reasons
                })
        return weak_students
    except Exception as e:
        print(f"Error detecting weak students: {e}")
        return []

def log_student_activity(student_id, activity_type, description):
    """
    Inserts a row into activity_logs. Fail-safe, does not crash user request on failure.
    """
    try:
        data = {
            "student_id": int(student_id),
            "activity_type": activity_type,
            "description": description
        }
        supabase.table("activity_logs").insert(data).execute()
        invalidate_student_activity_logs_cache(student_id)
        return True
    except Exception as e:
        print(f"Error logging student activity: {e}")
        return False

def create_notification(title, message, created_by):
    """
    Create announcement notifications from faculty.
    """
    try:
        data = {
            "title": title,
            "message": message,
            "created_by": int(created_by)
        }
        response = supabase.table("notifications").insert(data).execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error creating notification: {e}")
        raise e

def get_notifications(limit=10):
    """
    Retrieve announcements sorted by date descending, with faculty name.
    """
    try:
        response = supabase.table("notifications") \
            .select("*") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
            
        notifications = response.data or []
        for n in notifications:
            n["created_at"] = parse_date(n.get("created_at"))
            if n.get("created_by"):
                fac = supabase.table("faculty").select("name").eq("id", n["created_by"]).execute()
                if fac.data:
                    n["faculty_name"] = fac.data[0]["name"]
                else:
                    n["faculty_name"] = "Unknown Faculty"
            else:
                n["faculty_name"] = "System"
        return notifications
    except Exception as e:
        print(f"Error getting notifications: {e}")
        return []

def get_top_students(limit=10):
    """
    Gets leaderboard standings.
    """
    try:
        response = supabase.table("students") \
            .select("*") \
            .order("xp", desc=True) \
            .limit(limit) \
            .execute()
        records = response.data or []
        for idx, r in enumerate(records):
            r["rank"] = idx + 1
            r["levels_completed"] = get_levels_completed_count(r["id"])
        return records
    except Exception as e:
        print(f"Error getting top students: {e}")
        return []

def add_quiz_attempt(student_id, level, score, percentage, time_taken):
    """
    Log detailed quiz attempt with duration.
    """
    try:
        data = {
            "student_id": int(student_id),
            "level": int(level),
            "score": int(score),
            "percentage": int(percentage),
            "time_taken": int(time_taken)
        }
        response = supabase.table("quiz_attempts").insert(data).execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error adding quiz attempt: {e}")
        return None


# ==========================================================================
# CLASS QUIZ MANAGEMENT DATABASE INTERFACE
# ==========================================================================

def create_class_quiz(title, target_type, target_branch, created_by, questions):
    """
    Creates a new class quiz in the database.
    """
    try:
        data = {
            "title": title,
            "target_type": target_type,
            "target_branch": target_branch if target_type == "branch" else None,
            "created_by": int(created_by),
            "questions": questions
        }
        response = supabase.table("class_quizzes").insert(data).execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error creating class quiz: {e}")
        return None

def get_class_quiz_by_id(quiz_id):
    """
    Retrieves a single class quiz by its ID.
    """
    try:
        response = supabase.table("class_quizzes").select("*").eq("id", int(quiz_id)).execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error getting class quiz by id: {e}")
        return None

def get_all_class_quizzes():
    """
    Retrieves all class quizzes for the faculty view.
    """
    try:
        response = supabase.table("class_quizzes").select("*").order("created_at", desc=True).execute()
        records = response.data or []
        for r in records:
            r['created_at'] = parse_date(r.get('created_at'))
        return records
    except Exception as e:
        print(f"Error getting all class quizzes: {e}")
        return []

def get_class_quizzes_for_student(student_id, student_branch):
    """
    Retrieves all class quizzes that target this student (either all or branch-specific).
    Includes information on whether they have attempted it.
    """
    try:
        # Fetch quizzes
        response = supabase.table("class_quizzes") \
            .select("*") \
            .or_(f"target_type.eq.all,target_branch.eq.{student_branch}") \
            .order("created_at", desc=True) \
            .execute()
        
        quizzes = response.data or []
        
        # Fetch attempts by this student
        attempts_resp = supabase.table("class_quiz_attempts") \
            .select("*") \
            .eq("student_id", int(student_id)) \
            .execute()
        
        attempts = {a['class_quiz_id']: a for a in (attempts_resp.data or [])}
        
        result_quizzes = []
        for q in quizzes:
            q['created_at'] = parse_date(q.get('created_at'))
            attempt = attempts.get(q['id'])
            if attempt:
                q['attempted'] = True
                q['score'] = attempt['score']
                q['total_questions'] = attempt['total_questions']
            else:
                q['attempted'] = False
            result_quizzes.append(q)
            
        return result_quizzes
    except Exception as e:
        print(f"Error getting class quizzes for student: {e}")
        return []

def submit_class_quiz_attempt(class_quiz_id, student_id, score, total_questions, answers):
    """
    Inserts a student's attempt for a class quiz.
    """
    try:
        data = {
            "class_quiz_id": int(class_quiz_id),
            "student_id": int(student_id),
            "score": int(score),
            "total_questions": int(total_questions),
            "answers": answers
        }
        response = supabase.table("class_quiz_attempts").insert(data).execute()
        if response.data:
            res_record = response.data[0]
            res_record['completed_at'] = parse_date(res_record.get('completed_at'))
            invalidate_all_student_caches(student_id)
            return res_record
        return None
    except Exception as e:
        print(f"Error submitting class quiz attempt: {e}")
        return None

def get_class_quiz_results_for_faculty():
    """
    Retrieves all class quiz results/attempts for the faculty view.
    """
    try:
        response = supabase.table("class_quiz_attempts") \
            .select("*, student:students(full_name, roll_number, branch), quiz:class_quizzes(title)") \
            .order("completed_at", desc=True) \
            .execute()
        
        records = response.data or []
        for r in records:
            r['completed_at'] = parse_date(r.get('completed_at'))
        return records
    except Exception as e:
        print(f"Error getting class quiz results for faculty: {e}")
        return []

def get_student_activity_logs(student_id, limit=100):
    """
    Retrieves activity logs for a specific student from Supabase with caching.
    """
    now = time.time()
    cache_key = f"{student_id}_{limit}"
    
    with _activity_logs_cache_lock:
        if cache_key in _activity_logs_cache:
            timestamp, records = _activity_logs_cache[cache_key]
            if now - timestamp < CACHE_TTL:
                return [r.copy() for r in records]
                
    try:
        response = supabase.table("activity_logs") \
            .select("*") \
            .eq("student_id", int(student_id)) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
            
        records = response.data or []
        for r in records:
            r['created_at'] = parse_date(r.get('created_at'))
            
        with _activity_logs_cache_lock:
            _activity_logs_cache[cache_key] = (now, records)
            
        return [r.copy() for r in records]
    except Exception as e:
        print(f"Error getting student activity logs: {e}")
        return []

def log_speaking_attempt(student_id, activity_id, accuracy, pronunciation, fluency, word_count, earned_xp):
    """
    Inserts a record of a speaking practice attempt into speaking_attempts.
    Automatically logs student activity and updates XP.
    """
    try:
        data = {
            "student_id": int(student_id),
            "activity_id": activity_id,
            "accuracy": int(accuracy),
            "pronunciation": int(pronunciation),
            "fluency": int(fluency),
            "word_count": int(word_count),
            "earned_xp": int(earned_xp)
        }
        response = supabase.table("speaking_attempts").insert(data).execute()
        if earned_xp > 0:
            update_student_xp_and_level(student_id, earned_xp)
            log_student_activity(student_id, "SPEAKING_PRACTICE", f"Completed speaking task: {activity_id} (Accuracy: {accuracy}%)")
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error logging speaking attempt: {e}")
        return None

def log_game_attempt(student_id, game_type, word_or_level, score, streak, earned_xp, time_taken=None):
    """
    Inserts a record of a game attempt into game_attempts.
    Automatically logs student activity and updates XP.
    """
    try:
        data = {
            "student_id": int(student_id),
            "game_type": game_type,
            "word_or_level": word_or_level,
            "score": int(score),
            "streak": int(streak),
            "earned_xp": int(earned_xp)
        }
        if time_taken is not None:
            data["time_taken"] = int(time_taken)
        response = supabase.table("game_attempts").insert(data).execute()
        if earned_xp > 0:
            update_student_xp_and_level(student_id, earned_xp)
            log_student_activity(student_id, game_type, f"Played {game_type} - {word_or_level} (Score: {score})")
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error logging game attempt: {e}")
        return None

def get_student_speaking_stats(student_id):
    """
    Computes summary statistics for a student's speaking attempts from the database.
    """
    try:
        response = supabase.table("speaking_attempts").select("*").eq("student_id", int(student_id)).execute()
        attempts = response.data or []
        if not attempts:
            return {
                "total_xp": 0,
                "total_sessions": 0,
                "average_accuracy": 0,
                "average_pron": 0,
                "average_fluency": 0
            }
        
        total_xp = sum(a.get("earned_xp", 0) for a in attempts)
        total_sessions = len(attempts)
        average_accuracy = int(sum(a.get("accuracy", 0) for a in attempts) / total_sessions)
        average_pron = int(sum(a.get("pronunciation", 0) for a in attempts) / total_sessions)
        average_fluency = int(sum(a.get("fluency", 0) for a in attempts) / total_sessions)
        
        return {
            "total_xp": total_xp,
            "total_sessions": total_sessions,
            "average_accuracy": average_accuracy,
            "average_pron": average_pron,
            "average_fluency": average_fluency
        }
    except Exception as e:
        print(f"Error getting student speaking stats: {e}")
        return {
            "total_xp": 0,
            "total_sessions": 0,
            "average_accuracy": 0,
            "average_pron": 0,
            "average_fluency": 0
        }

def get_student_game_stats(student_id):
    """
    Computes summary statistics for a student's game attempts from the database.
    """
    try:
        response = supabase.table("game_attempts").select("*").eq("student_id", int(student_id)).execute()
        attempts = response.data or []
        if not attempts:
            return {
                "total_xp": 0,
                "total_plays": 0,
                "high_score": 0,
                "max_streak": 0
            }
        
        total_xp = sum(a.get("earned_xp", 0) for a in attempts)
        total_plays = len(attempts)
        high_score = max(a.get("score", 0) for a in attempts)
        max_streak = max(a.get("streak", 0) for a in attempts)
        
        return {
            "total_xp": total_xp,
            "total_plays": total_plays,
            "high_score": high_score,
            "max_streak": max_streak
        }
    except Exception as e:
        print(f"Error getting student game stats: {e}")
        return {
            "total_xp": 0,
            "total_plays": 0,
            "high_score": 0,
            "max_streak": 0
        }

def has_played_game_today(student_id):
    """
    Checks if a student has completed a daily game today.
    A game is completed if they unscrambled a word (WORD_SCRAMBLE)
    or completed a level in Word Connect (WORD_CONNECT with score 20).
    """
    try:
        response = supabase.table("game_attempts").select("*").eq("student_id", int(student_id)).execute()
        attempts = response.data or []
        
        today = datetime.now().date()
        for a in attempts:
            comp_at = parse_date(a.get("completed_at"))
            # Check if this completion date matches today (in server local time)
            if comp_at.date() == today:
                gtype = a.get("game_type")
                score = a.get("score", 0)
                if gtype == 'WORD_SCRAMBLE' or (gtype == 'WORD_CONNECT' and score == 20):
                    return True
        return False
    except Exception as e:
        print(f"Error checking daily game status: {e}")
        return False

def get_student_today_time_taken(student_id):
    """
    Retrieves the time taken by a student to complete today's daily game.
    """
    try:
        response = supabase.table("game_attempts").select("*").eq("student_id", int(student_id)).execute()
        attempts = response.data or []
        today = datetime.now().date()
        for a in attempts:
            comp_at = parse_date(a.get("completed_at"))
            if comp_at.date() == today:
                gtype = a.get("game_type")
                score = a.get("score", 0)
                if gtype == 'WORD_CONNECT' and score == 20:
                    tt = a.get("time_taken")
                    if tt is not None:
                        return int(tt)
                    word_or_level = a.get("word_or_level", "")
                    if "|" in word_or_level:
                        try:
                            return int(word_or_level.split("|")[1])
                        except ValueError:
                            pass
        return None
    except Exception as e:
        print(f"Error getting student today time taken: {e}")
        return None

def get_class_game_leaderboard(branch, year, current_student_id):
    """
    Ranks students of the same branch and year by their total game XP (earned_xp in game_attempts)
    and extracts today's completion time.
    Returns a list of dicts: [{'rank': 1, 'full_name': '...', 'game_xp': 100, 'time_taken': 42, 'is_current': True}]
    """
    try:
        # 1. Fetch all students in this class
        students_res = supabase.table("students") \
            .select("id, full_name, xp") \
            .eq("branch", branch) \
            .eq("year", int(year)) \
            .execute()
        students = students_res.data or []
        
        # 2. Fetch all game attempts
        attempts_res = supabase.table("game_attempts").select("student_id, earned_xp, word_or_level, game_type, score, completed_at, time_taken").execute()
        attempts = attempts_res.data or []
        
        today = datetime.now().date()
        
        # Map student_id to total game XP and today's time taken
        game_xp_map = {}
        today_time_map = {}
        for a in attempts:
            sid = a.get("student_id")
            game_xp_map[sid] = game_xp_map.get(sid, 0) + a.get("earned_xp", 0)
            
            # Extract time taken if completed today
            comp_at = parse_date(a.get("completed_at"))
            if comp_at.date() == today:
                gtype = a.get("game_type")
                score = a.get("score", 0)
                if gtype == 'WORD_CONNECT' and score == 20:
                    tt = a.get("time_taken")
                    if tt is not None:
                        today_time_map[sid] = int(tt)
                    else:
                        word_or_level = a.get("word_or_level", "")
                        if "|" in word_or_level:
                            try:
                                today_time_map[sid] = int(word_or_level.split("|")[1])
                            except ValueError:
                                pass
            
        leaderboard = []
        for s in students:
            sid = s["id"]
            leaderboard.append({
                "id": sid,
                "full_name": s["full_name"],
                "game_xp": game_xp_map.get(sid, 0),
                "overall_xp": s.get("xp", 0),
                "time_taken": today_time_map.get(sid, None)
            })
            
        # Sort by game_xp descending, then overall_xp descending
        leaderboard.sort(key=lambda x: (x["game_xp"], x["overall_xp"]), reverse=True)
        
        # Add rank and format output
        formatted_leaderboard = []
        for rank, item in enumerate(leaderboard, start=1):
            formatted_leaderboard.append({
                "rank": rank,
                "full_name": item["full_name"],
                "game_xp": item["game_xp"],
                "time_taken": item["time_taken"],
                "is_current": (item["id"] == int(current_student_id))
            })
            
        return formatted_leaderboard
    except Exception as e:
        print(f"Error building class leaderboard: {e}")
        return []

def get_student_speaking_progress(student_id):
    """
    Determines the next prompt index (level progress) for each speaking activity.
    Uses the highest successfully completed level (based on formatted activity_id)
    to decide where they should resume.
    """
    try:
        response = supabase.table("speaking_attempts").select("activity_id").eq("student_id", int(student_id)).execute()
        attempts = response.data or []
        
        progress = {}
        for a in attempts:
            act_id = a.get('activity_id', '')
            if '_' in act_id:
                parts = act_id.rsplit('_', 1)
                base_id = parts[0]
                try:
                    prompt_idx = int(parts[1])
                    next_idx = prompt_idx + 1
                    if base_id not in progress or next_idx > progress[base_id]:
                        progress[base_id] = next_idx
                except ValueError:
                    pass
        return progress
    except Exception as e:
        print(f"Error getting student speaking progress: {e}")
        return {}

FALLBACK_SPEAKING_ACTIVITIES = [
    {
        "id": "read_aloud",
        "name": "Read Aloud",
        "icon": "",
        "difficulty": "easy",
        "rewardXp": 10,
        "description": "Read sentences and paragraphs aloud to refine your pronunciation and speech rhythm.",
        "prompts": [
            "The weather is pleasant today.",
            "Practice makes a person perfect.",
            "Success comes to those who work hard and never give up.",
            "Technology is transforming how we communicate with each other.",
            "Engineering students should focus on developing excellent presentation skills.",
            "Reading books daily helps you build a rich vocabulary and improves your creative thinking.",
            "Effective communication is not just about speaking clearly, but also about active listening and understanding others.",
            "Public speaking is an essential skill for professionals. By practicing regularly, you can build self-confidence and inspire your audience."
        ]
    },
    {
        "id": "tongue_twister",
        "name": "Tongue Twister",
        "icon": "",
        "difficulty": "medium",
        "rewardXp": 15,
        "description": "Master complex phonetic sounds and sharpen your vocal agility.",
        "prompts": [
            "She sells seashells by the seashore.",
            "Peter Piper picked a peck of pickled peppers.",
            "How can a clam cram in a clean cream can?",
            "Six slippery snails slid slowly seaward."
        ]
    },
    {
        "id": "picture_desc",
        "name": "Picture Description",
        "icon": "",
        "difficulty": "medium",
        "rewardXp": 15,
        "description": "Observe visual scenes and describe what you see in structured English.",
        "prompts": [
            { "text": "A group of graduating students in black gowns celebrating and throwing their caps in the air.", "img": "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=400&q=80" },
            { "text": "A team of young software engineers having an active standup meeting in a modern tech office.", "img": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80" }
        ]
    },
    {
        "id": "one_question",
        "name": "One Question",
        "icon": "",
        "difficulty": "easy",
        "rewardXp": 20,
        "description": "Answer a thought-provoking daily question aloud in your own words.",
        "prompts": [
            "What motivates you to learn English?",
            "What did you learn or improve this week?",
            "Describe your favorite project or achievement."
        ]
    }
]

def get_speaking_activities():
    """
    Retrieves all speaking activities and prompts dynamically from the Supabase database.
    If the database query fails or returns no data, falls back to the local hardcoded configuration.
    """
    try:
        response = supabase.table("speaking_prompts").select("*").order("prompt_index", desc=False).execute()
        records = response.data or []
        
        if not records:
            return FALLBACK_SPEAKING_ACTIVITIES
            
        # Group records by activity_id
        activities_map = {}
        for r in records:
            act_id = r.get("activity_id")
            if act_id not in activities_map:
                activities_map[act_id] = {
                    "id": act_id,
                    "name": r.get("activity_name"),
                    "icon": r.get("activity_icon"),
                    "difficulty": r.get("difficulty"),
                    "rewardXp": r.get("reward_xp"),
                    "description": r.get("activity_description"),
                    "prompts": []
                }
            
            p_text = r.get("prompt_text")
            img_url = r.get("image_url")
            
            if img_url:
                activities_map[act_id]["prompts"].append({
                    "text": p_text,
                    "img": img_url
                })
            else:
                activities_map[act_id]["prompts"].append(p_text)
                
        # Return in the standard sequence order
        original_order = [
            "read_aloud", "tongue_twister", "picture_desc", "one_question"
        ]
        
        ordered_activities = []
        for o_id in original_order:
            if o_id in activities_map:
                ordered_activities.append(activities_map[o_id])
                
        # Append any other database activities not in original_order
        for act_id, act in activities_map.items():
            if act_id not in original_order:
                ordered_activities.append(act)
                
        return ordered_activities
    except Exception as e:
        print(f"Error getting speaking activities from db, falling back: {e}")
        return FALLBACK_SPEAKING_ACTIVITIES

def log_daily_challenge_attempt(student_id, level_id, score, stars, earned_xp):
    """
    Logs or updates a student's daily challenge attempt in Supabase.
    Also updates the student's XP.
    """
    try:
        data = {
            "student_id": int(student_id),
            "level_id": int(level_id),
            "score": int(score),
            "stars": int(stars),
            "earned_xp": int(earned_xp)
        }
        response = supabase.table("daily_challenge_attempts").upsert(data, on_conflict="student_id,level_id").execute()
        if earned_xp > 0:
            student = get_student_by_id(student_id)
            if student:
                new_xp = (student.get("xp") or 0) + earned_xp
                update_student_xp_and_level(student_id, new_xp, student.get("current_level"))
                log_student_activity(student_id, "DAILY_CHALLENGE", f"Completed Daily Challenge Level {level_id} (+{earned_xp} XP)")
        return response.data
    except Exception as e:
        print(f"Error logging daily challenge attempt: {e}")
        return None

def get_student_daily_challenge_progress(student_id):
    """
    Retrieves all completed daily challenge levels for a student from Supabase.
    """
    try:
        response = supabase.table("daily_challenge_attempts").select("*").eq("student_id", int(student_id)).execute()
        records = response.data or []
        res = {}
        for r in records:
            res[r["level_id"]] = {
                "completed": True,
                "bestScore": r.get("score", 0),
                "stars": r.get("stars", 1),
                "earned_xp": r.get("earned_xp", 0)
            }
        return res
    except Exception as e:
        print(f"Error getting student daily challenge progress: {e}")
        return {}







