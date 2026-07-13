import os
import psycopg2
from dotenv import load_dotenv

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    processed_dir = os.path.join(base_dir, "processed_data")
    
    # .env is in the parent directory (AirAware-main)
    env_path = os.path.join(os.path.dirname(base_dir), ".env")
    
    load_dotenv(dotenv_path=env_path)
    
    db_host = os.getenv("DB_HOST", "localhost")
    db_name = os.getenv("DB_NAME", "postgres")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "password")
    db_port = os.getenv("DB_PORT", "5432")

    print(f"Connecting to database {db_name} at {db_host}:{db_port}...")

    try:
        conn = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=db_user,
            password=db_password,
            port=db_port
        )
        conn.autocommit = False
        cursor = conn.cursor()
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return

    if not os.path.exists(processed_dir):
        print(f"Error: {processed_dir} does not exist.")
        return

    files = [f for f in os.listdir(processed_dir) if f.endswith('.csv')]
    print(f"Found {len(files)} files to push to database.")

    insert_query = """
        INSERT INTO aqi_data (
            station_id, station_name, recorded_at,
            pm25, pm10, no2, nh3, so2, co, ozone,
            pm25_lag1, pm25_lag7, pm25_lag14, pm25_7day_ma,
            pm10_lag1, pm10_lag7, pm10_lag14, pm10_7day_ma,
            no2_lag1, no2_lag7, no2_lag14, no2_7day_ma,
            nh3_lag1, nh3_lag7, nh3_lag14, nh3_7day_ma,
            so2_lag1, so2_lag7, so2_lag14, so2_7day_ma,
            co_lag1, co_lag7, co_lag14, co_7day_ma,
            ozone_lag1, ozone_lag7, ozone_lag14, ozone_7day_ma,
            month, day_of_week, is_weekend
        )
        SELECT
            s.id, s.station_name,
            TO_TIMESTAMP(t."Date", 'YYYY-MM-DD'),
            NULLIF(t."PM2.5", '')::DECIMAL, NULLIF(t."PM10", '')::DECIMAL, NULLIF(t."NO2", '')::DECIMAL,
            NULLIF(t."NH3", '')::DECIMAL, NULLIF(t."SO2", '')::DECIMAL, NULLIF(t."CO", '')::DECIMAL, NULLIF(t."Ozone", '')::DECIMAL,
            NULLIF(t."PM2.5_Lag1", '')::DECIMAL, NULLIF(t."PM2.5_Lag7", '')::DECIMAL, NULLIF(t."PM2.5_Lag14", '')::DECIMAL, NULLIF(t."PM2.5_7Day_MA", '')::DECIMAL,
            NULLIF(t."PM10_Lag1", '')::DECIMAL, NULLIF(t."PM10_Lag7", '')::DECIMAL, NULLIF(t."PM10_Lag14", '')::DECIMAL, NULLIF(t."PM10_7Day_MA", '')::DECIMAL,
            NULLIF(t."NO2_Lag1", '')::DECIMAL, NULLIF(t."NO2_Lag7", '')::DECIMAL, NULLIF(t."NO2_Lag14", '')::DECIMAL, NULLIF(t."NO2_7Day_MA", '')::DECIMAL,
            NULLIF(t."NH3_Lag1", '')::DECIMAL, NULLIF(t."NH3_Lag7", '')::DECIMAL, NULLIF(t."NH3_Lag14", '')::DECIMAL, NULLIF(t."NH3_7Day_MA", '')::DECIMAL,
            NULLIF(t."SO2_Lag1", '')::DECIMAL, NULLIF(t."SO2_Lag7", '')::DECIMAL, NULLIF(t."SO2_Lag14", '')::DECIMAL, NULLIF(t."SO2_7Day_MA", '')::DECIMAL,
            NULLIF(t."CO_Lag1", '')::DECIMAL, NULLIF(t."CO_Lag7", '')::DECIMAL, NULLIF(t."CO_Lag14", '')::DECIMAL, NULLIF(t."CO_7Day_MA", '')::DECIMAL,
            NULLIF(t."Ozone_Lag1", '')::DECIMAL, NULLIF(t."Ozone_Lag7", '')::DECIMAL, NULLIF(t."Ozone_Lag14", '')::DECIMAL, NULLIF(t."Ozone_7Day_MA", '')::DECIMAL,
            NULLIF(t."Month", '')::INTEGER, t."Day_of_Week",
            CASE WHEN LOWER(t."Is_Weekend") = 'true' THEN TRUE ELSE FALSE END
        FROM temp_aqi_import t
        JOIN stations s ON s.file_name = %s
        ON CONFLICT (station_id, recorded_at) DO NOTHING;
    """

    for idx, filename in enumerate(files, 1):
        file_path = os.path.join(processed_dir, filename)
        print(f"[{idx}/{len(files)}] Processing {filename}...")
        try:
            # Create temporary table that will automatically drop when we commit
            cursor.execute("""
                CREATE TEMP TABLE temp_aqi_import (
                    "Date" TEXT, "PM2.5" TEXT, "PM10" TEXT, "NO2" TEXT, "NH3" TEXT, "SO2" TEXT, "CO" TEXT, "Ozone" TEXT,
                    "PM2.5_Lag1" TEXT, "PM2.5_Lag7" TEXT, "PM2.5_Lag14" TEXT, "PM2.5_7Day_MA" TEXT,
                    "PM10_Lag1" TEXT, "PM10_Lag7" TEXT, "PM10_Lag14" TEXT, "PM10_7Day_MA" TEXT,
                    "NO2_Lag1" TEXT, "NO2_Lag7" TEXT, "NO2_Lag14" TEXT, "NO2_7Day_MA" TEXT,
                    "NH3_Lag1" TEXT, "NH3_Lag7" TEXT, "NH3_Lag14" TEXT, "NH3_7Day_MA" TEXT,
                    "SO2_Lag1" TEXT, "SO2_Lag7" TEXT, "SO2_Lag14" TEXT, "SO2_7Day_MA" TEXT,
                    "CO_Lag1" TEXT, "CO_Lag7" TEXT, "CO_Lag14" TEXT, "CO_7Day_MA" TEXT,
                    "Ozone_Lag1" TEXT, "Ozone_Lag7" TEXT, "Ozone_Lag14" TEXT, "Ozone_7Day_MA" TEXT,
                    "Month" TEXT, "Day_of_Week" TEXT, "Is_Weekend" TEXT
                ) ON COMMIT DROP;
            """)
            
            # Use COPY FROM STDIN to bulk insert into the temporary table
            with open(file_path, 'r', encoding='utf-8') as f:
                copy_sql = 'COPY temp_aqi_import FROM STDIN WITH CSV HEADER DELIMITER as \',\''
                cursor.copy_expert(sql=copy_sql, file=f)
            
            # Execute the insert statement
            cursor.execute(insert_query, (filename,))
            
            # Get number of inserted rows
            inserted_count = cursor.rowcount
            print(f"  -> Pushed {inserted_count} new rows to database.")
            
            # Commit the transaction for this file
            conn.commit()
            
        except Exception as e:
            print(f"  -> Error processing {filename}: {e}")
            conn.rollback()

    cursor.close()
    conn.close()
    print("\nDatabase push complete!")

if __name__ == "__main__":
    main()
