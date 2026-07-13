import pandas as pd
import numpy as np
import sys
import os
import joblib
import json
import psycopg2
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

# DB Configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "AirAware"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "123456"),
    "port": os.getenv("DB_PORT", "5432")
}

TARGETS = ["PM2.5", "PM10", "NO2", "NH3", "SO2", "CO", "Ozone"]
DATE_COL = "Date"
FORECAST_DAYS = 14
LAGS = [1, 2, 3, 7, 14]
ROLLING_WINDOWS = [3, 7, 14]

def fetch_data_from_db(station_id):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        query = f"""
            SELECT recorded_at as "{DATE_COL}", 
                   pm25 as "PM2.5", pm10 as "PM10", no2 as "NO2", 
                   nh3 as "NH3", so2 as "SO2", co as "CO", ozone as "Ozone"
            FROM aqi_data 
            WHERE station_id = {station_id}
            ORDER BY recorded_at ASC
        """
        df = pd.read_sql(query, conn)
        conn.close()
        return df
    except Exception as e:
        raise Exception(f"Database error: {str(e)}")

def make_features(df, targets):
    df = df.copy()
    df[DATE_COL] = pd.to_datetime(df[DATE_COL])
    df["day_of_week"] = df[DATE_COL].dt.dayofweek
    df["month"] = df[DATE_COL].dt.month
    df["day_of_year"] = df[DATE_COL].dt.dayofyear
    df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)

    for col in targets:
        for lag in LAGS:
            df[f"{col}_lag{lag}"] = df[col].shift(lag)
        for w in ROLLING_WINDOWS:
            df[f"{col}_roll{w}"] = df[col].shift(1).rolling(window=w).mean()
    return df

def get_forecast(station_id, model_path):
    df = fetch_data_from_db(station_id)
    if df.empty:
        return {"error": "No historical data found for this station"}

    if not os.path.exists(model_path):
        return {"error": "Model not found"}

    available_targets = [t for t in TARGETS if t in df.columns]
    models = joblib.load(model_path)
    
    df_feat_sample = make_features(df.head(20), available_targets).dropna()
    exclude = [DATE_COL] + available_targets
    feature_cols = [c for c in df_feat_sample.columns if c not in exclude and "_Lag" not in c and "_MA" not in c and "Month" != c and "Day_of_Week" != c and "Is_Weekend" != c]

    future_df = df.copy()
    last_date = df[DATE_COL].max()
    forecast_rows = []

    for day in range(1, FORECAST_DAYS + 1):
        next_date = last_date + timedelta(days=day)
        temp_df = make_features(future_df, available_targets)
        last_row = temp_df.iloc[[-1]].copy()

        last_row[DATE_COL]      = next_date
        last_row["day_of_week"] = next_date.dayofweek
        last_row["month"]       = next_date.month
        last_row["day_of_year"] = next_date.timetuple().tm_yday
        last_row["dow_sin"]     = np.sin(2 * np.pi * next_date.dayofweek / 7)
        last_row["dow_cos"]     = np.cos(2 * np.pi * next_date.dayofweek / 7)
        last_row["month_sin"]   = np.sin(2 * np.pi * next_date.month / 12)
        last_row["month_cos"]   = np.cos(2 * np.pi * next_date.month / 12)

        X_next = last_row[feature_cols]

        row = {"date": next_date.strftime("%Y-%m-%d")}
        for target in available_targets:
            pred_log = models[target].predict(X_next)[0]
            pred = np.expm1(pred_log)
            # Convert to standard float to avoid JSON serialization errors
            row[target.lower().replace(".", "")] = round(float(max(pred, 0)), 2)

        forecast_rows.append(row)
        new_row = pd.DataFrame([{DATE_COL: next_date, **{t: row[t.lower().replace(".", "")] for t in available_targets}}])
        future_df = pd.concat([future_df, new_row], ignore_index=True)

    return {"forecast": forecast_rows}

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)
    
    station_id = sys.argv[1]
    model_path = sys.argv[2]
    
    try:
        result = get_forecast(station_id, model_path)
        print(json.dumps(result, cls=NumpyEncoder))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

