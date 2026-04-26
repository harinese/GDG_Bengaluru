import sqlite3
import hashlib
import json
import os
import secrets

DB_PATH = "users.db"

def _hash_password(password: str) -> str:
    # A simple SHA-256 hash.
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            profile TEXT NOT NULL,
            session_token TEXT
        )
    """)
    # Safely alter table to add session_token if it was missing from a previous run
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN session_token TEXT")
    except sqlite3.OperationalError:
        pass # Column already exists
    
    conn.commit()
    conn.close()

def create_user(phone: str, password: str, profile_dict: dict) -> tuple:
    """Returns (profile_dict, session_token)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE phone = ?", (phone,))
    if cursor.fetchone() is not None:
        conn.close()
        raise ValueError("Phone number already registered")
        
    pwd_hash = _hash_password(password)
    profile_json = json.dumps(profile_dict)
    token = secrets.token_hex(32)
    
    cursor.execute(
        "INSERT INTO users (phone, password_hash, profile, session_token) VALUES (?, ?, ?, ?)",
        (phone, pwd_hash, profile_json, token)
    )
    conn.commit()
    conn.close()
    
    return profile_dict, token

def verify_user(phone: str, password: str) -> tuple:
    """Returns (profile_dict, session_token) or (None, None)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    pwd_hash = _hash_password(password)
    cursor.execute("SELECT profile FROM users WHERE phone = ? AND password_hash = ?", (phone, pwd_hash))
    row = cursor.fetchone()
    
    if row:
        profile_dict = json.loads(row[0])
        token = secrets.token_hex(32)
        # Update their session token on login
        cursor.execute("UPDATE users SET session_token = ? WHERE phone = ?", (token, phone))
        conn.commit()
        conn.close()
        return profile_dict, token
        
    conn.close()
    return None, None

def get_user_by_token(token: str) -> dict:
    """Returns the profile if the token is valid, else None"""
    if not token:
        return None
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT profile FROM users WHERE session_token = ?", (token,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return json.loads(row[0])
    return None

def update_user_profile(token: str, profile_dict: dict):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    profile_json = json.dumps(profile_dict)
    
    cursor.execute("UPDATE users SET profile = ? WHERE session_token = ?", (profile_json, token))
    conn.commit()
    conn.close()

# Initialize DB on load
init_db()
