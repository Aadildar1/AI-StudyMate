import os
import json
from contextlib import contextmanager

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from fastapi import HTTPException


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Add it to backend/.env.")


# A small pool so each request reuses an open connection instead of
# paying the TLS handshake to Supabase on every query. It is created on
# first use so the API can still boot (and report a clear error) when the
# database is temporarily unreachable.
_connection_pool = None


def _get_pool():
    global _connection_pool

    if _connection_pool is None:
        _connection_pool = pool.SimpleConnectionPool(
            minconn=1,
            maxconn=5,
            dsn=DATABASE_URL,
        )

    return _connection_pool


@contextmanager
def get_cursor(dict_rows=False):
    """Borrow a pooled connection, yield a cursor, commit on success.

    The connection is always returned to the pool, even if the query
    raises, so a failed request can never leak a connection.
    """

    try:
        connection_pool = _get_pool()
        connection = connection_pool.getconn()
    except psycopg2.OperationalError as error:
        print(f"Database connection failed: {error}")
        raise HTTPException(
            status_code=503,
            detail="The database is currently unreachable. Please try again shortly."
        )

    try:
        cursor_factory = RealDictCursor if dict_rows else None
        cursor = connection.cursor(cursor_factory=cursor_factory)

        try:
            yield cursor
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            cursor.close()

    finally:
        connection_pool.putconn(connection)


def normalize_topic(topic):
    return " ".join(topic.strip().lower().split())


def create_database():
    """Create tables if missing. Logs instead of crashing when the DB is down."""

    try:
        _create_tables()
    except HTTPException as error:
        print(f"WARNING: skipping table setup, {error.detail}")


def _create_tables():

    with get_cursor() as cursor:

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
        CREATE INDEX IF NOT EXISTS study_history_user_id_idx
        ON study_history (user_id)
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS learning_cache (
            id SERIAL PRIMARY KEY,
            topic TEXT UNIQUE NOT NULL,
            summary TEXT NOT NULL,
            quiz TEXT NOT NULL,
            videos TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # Older deployments created the table without the videos column.
        cursor.execute("""
        ALTER TABLE learning_cache
        ADD COLUMN IF NOT EXISTS videos TEXT
        """)

    print("PostgreSQL tables ready.")


def save_study_history(
    user_id,
    topic,
    original_score,
    original_total,
    practice_score,
    practice_total,
    progress_analysis
):

    with get_cursor() as cursor:

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


def get_study_history(user_id):
    """Every study session for one user, newest first."""

    with get_cursor(dict_rows=True) as cursor:

        cursor.execute("""
            SELECT
                id,
                topic,
                original_score,
                original_total,
                practice_score,
                practice_total,
                progress_analysis,
                studied_at
            FROM study_history
            WHERE user_id = %s
            ORDER BY studied_at DESC
        """, (user_id,))

        return cursor.fetchall()


def get_cached_learning_content(topic):

    normalized_topic = normalize_topic(topic)

    with get_cursor(dict_rows=True) as cursor:

        cursor.execute("""
            SELECT summary, quiz, videos
            FROM learning_cache
            WHERE topic = %s
        """, (normalized_topic,))

        row = cursor.fetchone()

    if row is None:
        return None

    return {
        "summary": row["summary"],
        "quiz": json.loads(row["quiz"]),
        # None (not []) when videos were never cached, so the caller can
        # tell "no videos found" apart from "never looked them up".
        "videos": json.loads(row["videos"]) if row["videos"] else None,
    }


def save_learning_content_cache(topic, summary, quiz, videos=None):

    normalized_topic = normalize_topic(topic)

    with get_cursor() as cursor:

        cursor.execute("""
            INSERT INTO learning_cache (topic, summary, quiz, videos)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (topic)
            DO UPDATE SET
                summary = EXCLUDED.summary,
                quiz = EXCLUDED.quiz,
                videos = COALESCE(EXCLUDED.videos, learning_cache.videos)
        """, (
            normalized_topic,
            summary,
            json.dumps(quiz),
            json.dumps(videos) if videos is not None else None,
        ))
