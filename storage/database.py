"""
SQLite Database interface for NQ Bias Bot users and deliveries.
"""
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from config import BASE_DIR

DB_PATH = BASE_DIR / "storage" / "database.db"


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create schema tables if they do not exist."""
    DB_PATH.parent.mkdir(exist_ok=True)
    with get_db_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                whatsapp TEXT,
                delivery_time TEXT NOT NULL DEFAULT '08:30',
                timezone TEXT NOT NULL DEFAULT 'America/New_York',
                subscription_status TEXT NOT NULL DEFAULT 'free',
                token TEXT UNIQUE NOT NULL,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS deliveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                report_date TEXT NOT NULL,
                channel TEXT NOT NULL,
                status TEXT NOT NULL,
                error_message TEXT,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        conn.commit()


def register_user(
    email: str,
    whatsapp: Optional[str] = None,
    delivery_time: str = "08:30",
    timezone: str = "America/New_York",
    subscription_status: str = "free"
) -> Dict:
    """Register a new user and generate a unique settings token."""
    token = str(uuid.uuid4())
    with get_db_connection() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO users (email, whatsapp, delivery_time, timezone, subscription_status, token)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (email.strip().lower(), whatsapp, delivery_time, timezone, subscription_status, token)
            )
            conn.commit()
            user_id = cursor.lastrowid
            return {
                "id": user_id,
                "email": email,
                "whatsapp": whatsapp,
                "delivery_time": delivery_time,
                "timezone": timezone,
                "subscription_status": subscription_status,
                "token": token
            }
        except sqlite3.IntegrityError:
            # User already exists, retrieve existing user
            cursor = conn.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),))
            row = cursor.fetchone()
            return dict(row)


def get_user_by_email(email: str) -> Optional[Dict]:
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()
        return dict(row) if row else None


def get_user_by_token(token: str) -> Optional[Dict]:
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE token = ?", (token,)).fetchone()
        return dict(row) if row else None


def update_user_settings(
    token: str,
    whatsapp: Optional[str],
    delivery_time: str,
    timezone: str
) -> bool:
    """Update settings for a user identified by their token."""
    with get_db_connection() as conn:
        cursor = conn.execute(
            """
            UPDATE users
            SET whatsapp = ?, delivery_time = ?, timezone = ?
            WHERE token = ?
            """,
            (whatsapp, delivery_time, timezone, token)
        )
        conn.commit()
        return cursor.rowcount > 0


def update_user_subscription(email: str, status: str) -> bool:
    """Update subscription status (e.g. from lemon squeezy webhooks)."""
    with get_db_connection() as conn:
        cursor = conn.execute(
            """
            UPDATE users
            SET subscription_status = ?
            WHERE email = ?
            """,
            (status, email.strip().lower())
        )
        conn.commit()
        return cursor.rowcount > 0


def log_delivery(
    user_id: int,
    report_date: str,
    channel: str,
    status: str,
    error_message: Optional[str] = None
):
    """Log report delivery to prevent duplicate delivery and keep metrics."""
    with get_db_connection() as conn:
        conn.execute(
            """
            INSERT INTO deliveries (user_id, report_date, channel, status, error_message)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, report_date, channel, status, error_message)
        )
        conn.commit()


def check_delivery_logged(user_id: int, report_date: str, channel: str) -> bool:
    """Check if the report has already been successfully delivered to the user today."""
    with get_db_connection() as conn:
        row = conn.execute(
            """
            SELECT 1 FROM deliveries
            WHERE user_id = ? AND report_date = ? AND channel = ? AND status = 'success'
            """,
            (user_id, report_date, channel)
        ).fetchone()
        return row is not None


def get_all_users() -> List[Dict]:
    with get_db_connection() as conn:
        rows = conn.execute("SELECT * FROM users").fetchall()
        return [dict(r) for r in rows]
