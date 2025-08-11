import os
import sqlite3

# The same absolute path as in db.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "metadata.db")
print(f"Database path in use: {DB_PATH}")
def add_uploaded_by_uid_column():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    try:
        cur.execute("ALTER TABLE models ADD COLUMN uploaded_by_uid TEXT;")
        print("Column 'uploaded_by_uid' added successfully.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column 'uploaded_by_uid' already exists, skipping.")
        else:
            raise
    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_uploaded_by_uid_column()
