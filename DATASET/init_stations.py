import os
import csv
import psycopg2
from dotenv import load_dotenv

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_file = os.path.join(base_dir, "cpcb_city_station.csv")
    
    # .env is in the parent directory (AirAware-main)
    env_path = os.path.join(os.path.dirname(base_dir), ".env")
    
    load_dotenv(dotenv_path=env_path)
    
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env.")
        return

    print("Connecting to Supabase PostgreSQL via DATABASE_URL...")
    try:
        conn = psycopg2.connect(db_url, sslmode="require")
        conn.autocommit = True
        cursor = conn.cursor()
    except Exception as e:
        print(f"Error connecting to DB: {e}")
        return

    if not os.path.exists(csv_file):
        print(f"Error: Could not find {csv_file}")
        return

    insert_query = """
        INSERT INTO stations (city, station_name, file_name, latitude, longitude, address)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (station_name) DO UPDATE SET
            file_name = EXCLUDED.file_name,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            address = EXCLUDED.address;
    """

    inserted = 0
    with open(csv_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            city = row["City"]
            station = row["Station"]
            
            # Recalculate file_name safely to match what Python outputs perfectly on disk
            # This fixes the mismatch between '_-_MPCB' in CSV and '___MPCB' on disk
            safe_city = "".join([c if c.isalnum() else "_" for c in city])
            safe_station = "".join([c if c.isalnum() else "_" for c in station])
            actual_file_name = f"{safe_city}_{safe_station}.csv"
            
            try:
                lat = float(row["Lat"]) if row["Lat"] else None
                lon = float(row["Long"]) if row["Long"] else None
                
                cursor.execute(insert_query, (
                    city,
                    station,
                    actual_file_name,
                    lat,
                    lon,
                    row["Address"]
                ))
                inserted += 1
            except Exception as e:
                print(f"Failed to insert {station}: {e}")

    print(f"Successfully inserted/updated {inserted} stations in the database!")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
