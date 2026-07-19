import os
import sqlite3
import json


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATABASE_NAME = os.path.join(
    BASE_DIR,
    "studymate.db"
)


def normalize_topic(topic):

    return " ".join(
        topic.strip().lower().split()
    )


def create_database():

    connection = sqlite3.connect(DATABASE_NAME)

    cursor = connection.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS study_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

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
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic TEXT UNIQUE NOT NULL,
            summary TEXT NOT NULL,
            quiz TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()

    connection.close()


def save_study_history(
    user_id,
    topic,
    original_score,
    original_total,
    practice_score,
    practice_total,
    progress_analysis
):

    connection = sqlite3.connect(DATABASE_NAME)

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
            VALUES (?, ?, ?, ?, ?, ?, ?)
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

    connection.close()


def get_study_history(user_id):

    connection = sqlite3.connect(DATABASE_NAME)

    connection.row_factory = sqlite3.Row

    cursor = connection.cursor()

    cursor.execute("""
    SELECT *
        FROM study_history

        WHERE user_id = ?

        ORDER BY studied_at DESC
    """, ( 
        user_id,
    ))

    rows = cursor.fetchall()

    history = [
        dict(row)
        for row in rows
    ]

    connection.close()

    return history


def get_cached_learning_content(topic):

    normalized_topic = normalize_topic(topic)

    print(
        f"CACHE LOOKUP TOPIC: '{normalized_topic}'"
    )

    print(
        f"DATABASE PATH: {DATABASE_NAME}"
    )

    connection = sqlite3.connect(DATABASE_NAME)

    connection.row_factory = sqlite3.Row

    cursor = connection.cursor()

    cursor.execute("""
        SELECT summary, quiz
        FROM learning_cache
        WHERE topic = ?
    """, (
        normalized_topic,
    ))

    row = cursor.fetchone()

    connection.close()

    if row is None:

        print(
            f"CACHE DATABASE RESULT: NOT FOUND"
        )

        return None

    print(
        f"CACHE DATABASE RESULT: FOUND"
    )

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

    print(
        f"SAVING CACHE TOPIC: '{normalized_topic}'"
    )

    connection = sqlite3.connect(DATABASE_NAME)

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO learning_cache (
            topic,
            summary,
            quiz
        )
        VALUES (?, ?, ?)
        ON CONFLICT(topic)
        DO UPDATE SET
            summary = excluded.summary,
            quiz = excluded.quiz
    """, (
        normalized_topic,
        summary,
        quiz_json
    ))

    connection.commit()

    connection.close()

    print(
        f"CACHE DATABASE SAVE COMPLETE"
    )
def get_learning_library():

    connection = sqlite3.connect(DATABASE_NAME)

    connection.row_factory = sqlite3.Row

    cursor = connection.cursor()

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

    rows = cursor.fetchall()
    print("Rows fetched:", rows)
    connection.close()
    
    return [dict(row) for row in rows]