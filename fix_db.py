import sqlite3

conn = sqlite3.connect('digital_twin.db')
try:
    conn.execute('ALTER TABLE inspections ADD COLUMN reasoning_steps TEXT')
    conn.commit()
    print("✅ Column added successfully!")
except Exception as e:
    print(f"Error: {e}")
conn.close()