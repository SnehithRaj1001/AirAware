import os
import psycopg2
from dotenv import load_dotenv

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(base_dir)
    
    env_path = os.path.join(parent_dir, ".env")
    db_sql_path = os.path.join(parent_dir, "db.sql")

    load_dotenv(env_path)

    print("Connecting to DB to initialize tables...")
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'postgres'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password'),
            port=os.getenv('DB_PORT', '5432')
        )
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
