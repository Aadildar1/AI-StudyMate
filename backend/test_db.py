import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

try:
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    print("✅ Connected to Supabase successfully!")

    cur = conn.cursor()
    cur.execute("SELECT version();")

    version = cur.fetchone()
    print(version)

    cur.close()
    conn.close()

except Exception as e:
    print("❌ Connection failed:")
    print(e)