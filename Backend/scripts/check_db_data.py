import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "AirAware"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "123456"),
    "port": os.getenv("DB_PORT", "5432")
}

def check_data():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("--- Station Counts in aqi_data ---")
        cur.execute("SELECT station_id, COUNT(*) FROM aqi_data GROUP BY station_id ORDER BY COUNT(*) DESC;")
        rows = cur.fetchall()
        for row in rows:
            print(f"Station ID {row[0]}: {row[1]} readings")
            
        if not rows:
            print("No data found in aqi_data table!")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error connecting to DB: {e}")

if __name__ == "__main__":
    check_data()
