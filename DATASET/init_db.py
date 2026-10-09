import os
import psycopg2
from dotenv import load_dotenv

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(base_dir)
    
    env_path = os.path.join(parent_dir, ".env")
    db_sql_path = os.path.join(parent_dir, "db.sql")

    load_dotenv(env_path)

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env.")
        return

    print("Connecting to Supabase PostgreSQL via DATABASE_URL to initialize tables...")
    try:
        conn = psycopg2.connect(db_url, sslmode="require")
        conn.autocommit = True
        cursor = conn.cursor()

        with open(db_sql_path, 'r') as f:
            sql = f.read()

        cursor.execute(sql)
        print("Successfully created tables from db.sql!")

        cursor.close()
        conn.close()
    except Exception as e:
        print("Error initializing DB:", e)

if __name__ == "__main__":
    main()
