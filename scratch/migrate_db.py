import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend', 'jarvis.db')

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if columns exist
    cursor.execute("PRAGMA table_info(users)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if "full_name" not in columns:
        print("Adding full_name column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN full_name VARCHAR")
    
    if "nickname" not in columns:
        print("Adding nickname column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN nickname VARCHAR")
        
    conn.commit()
    conn.close()
    print("Migration successful.")

if __name__ == "__main__":
    migrate()
