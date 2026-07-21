import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import json


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    return psycopg2.connect(DATABASE_URL)

def normalize_topic(topic):

    return " ".join(
        topic.strip().lower().split()
    )


def create_database():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS study_history (
        id SERIAL PRIMARY KEY,

        user_id TEXT NOT NULL,

        topic TEXT NOT NULL,

        original_score INTEGER NOT NULL,

        original_total INTEGER NOT NULL,

        practice_score INTEGER NOT NULL,

        practice_total INTEGER NOT NULL,

        progress_analysis TEXT,

        studied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS learning_cache (
        id SERIAL PRIMARY KEY,

        topic TEXT UNIQUE NOT NULL,

        summary TEXT NOT NULL,

        quiz TEXT NOT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    connection.commit()

    cursor.close()
    connection.close()
    print("✅ PostgreSQL tables ready.")


def save_study_history(
    user_id,
    topic,
    original_score,
    original_total,
    practice_score,
    practice_total,
    progress_analysis
):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO study_history (
            user_id,
            topic,
            original_score,
            original_total,
            practice_score,
            practice_total,
            progress_analysis
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        user_id,
        topic,
        original_score,
        original_total,
        practice_score,
        practice_total,
        progress_analysis
    ))

    connection.commit()

    cursor.close()
    connection.close()


def get_study_history(user_id):

    connection = get_connection()

    cursor = connection.cursor(cursor_factory=RealDictCursor)

    cursor.execute("""
        SELECT *
        FROM study_history
        WHERE user_id = %s
        ORDER BY studied_at DESC
    """, (user_id,))

    history = cursor.fetchall()

    cursor.close()
    connection.close()

    return history
def get_cached_learning_content(topic):

    normalized_topic = normalize_topic(topic)

    connection = get_connection()

    cursor = connection.cursor(cursor_factory=RealDictCursor)

    cursor.execute("""
        SELECT summary, quiz
        FROM learning_cache
        WHERE topic = %s
    """, (normalized_topic,))

    row = cursor.fetchone()

    cursor.close()
    connection.close()

    if row is None:
        return None

    return {
        "summary": row["summary"],
        "quiz": json.loads(row["quiz"])
    }


def save_learning_content_cache(
    topic,
    summary,
    quiz
):

    normalized_topic = normalize_topic(topic)

    quiz_json = json.dumps(quiz)

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO learning_cache (
            topic,
            summary,
            quiz
        )
        VALUES (%s, %s, %s)
        ON CONFLICT (topic)
        DO UPDATE SET
            summary = EXCLUDED.summary,
            quiz = EXCLUDED.quiz
    """, (
        normalized_topic,
        summary,
        quiz_json
    ))

    connection.commit()

    cursor.close()
    connection.close()
def get_learning_library():

    connection = get_connection()

    cursor = connection.cursor(cursor_factory=RealDictCursor)

    cursor.execute("""
        SELECT
            topic,
            original_score,
            original_total,
            practice_score,
            practice_total,
            studied_at
        FROM study_history
        ORDER BY studied_at DESC
    """)

    library = cursor.fetchall()

    cursor.close()
    connection.close()

    return library