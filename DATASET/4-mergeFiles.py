import os
import re
import pandas as pd

def normalize_columns(df):
    """Strip unit postfixes and standardize the date/timestamp column name."""
    rename_map = {}
    for col in df.columns:
        h = col.strip()
        h_lower = h.lower()
        # Normalize all date-like columns to 'Timestamp'
        if h_lower in ('timestamp', 'date', 'from date', 'date from'):
            rename_map[col] = 'Timestamp'
        else:
            # Strip units in parentheses e.g. "PM2.5 (µg/m³)" -> "PM2.5"
            clean = re.sub(r'\s*\(.*?\)', '', h).strip()
            if clean != h:
                rename_map[col] = clean
    if rename_map:
        df = df.rename(columns=rename_map)
    return df

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    downloaded_dir = os.path.join(base_dir, "downloaded_data")
    processed_dir = os.path.join(base_dir, "processed_data")

    if not os.path.exists(processed_dir):
        os.makedirs(processed_dir)

    if not os.path.exists(downloaded_dir):
        print(f"Error: {downloaded_dir} does not exist.")
        return

    print(f"Reading files from {downloaded_dir}...")

    files = [f for f in os.listdir(downloaded_dir) if f.endswith('.csv')]

    # Group files by their base name (without _2024.csv, _2025.csv, _2026.csv)
    file_groups = {}
    for file in files:
        year = None
        base_name = None
        for y in ('2024', '2025', '2026'):
            suffix = f'_{y}.csv'
            if file.endswith(suffix):
                base_name = file[:-len(suffix)]
                year = y
                break
        if base_name is None:
            continue  # Unknown format, skip

        if base_name not in file_groups:
            file_groups[base_name] = {}
        file_groups[base_name][year] = os.path.join(downloaded_dir, file)

    total_merged = 0

    for base_name, group in file_groups.items():
        print(f"Processing {base_name}...")
        dfs = []

        for year in ('2024', '2025', '2026'):
            if year in group:
                try:
                    df_year = pd.read_csv(group[year])
                    df_year = normalize_columns(df_year)  # Normalize before concat
                    dfs.append(df_year)
                    print(f"  Loaded {year} data ({len(df_year)} rows)")
                except Exception as e:
                    print(f"  Error loading {year} data: {e}")

        if dfs:
            # Concatenate all years
            merged_df = pd.concat(dfs, ignore_index=True)

            # Sort by Timestamp/Date column
            ts_col = None
            if 'Timestamp' in merged_df.columns:
                ts_col = 'Timestamp'
            elif 'Date' in merged_df.columns:
                ts_col = 'Date'

            if ts_col:
                try:
                    merged_df[ts_col] = pd.to_datetime(merged_df[ts_col], format='mixed')
                    merged_df = merged_df.sort_values(by=ts_col)
                except Exception as e:
                    print(f"  Warning: Could not sort by {ts_col}: {e}")

            # Deduplicate based on the timestamp column (keep first occurrence)
            before_dedup = len(merged_df)
            if ts_col:
                merged_df = merged_df.drop_duplicates(subset=[ts_col], keep='first')
                after_dedup = len(merged_df)
                if before_dedup != after_dedup:
                    print(f"  Removed {before_dedup - after_dedup} duplicate rows.")

            # Rename Timestamp to Date
            if ts_col == 'Timestamp':
                merged_df = merged_df.rename(columns={'Timestamp': 'Date'})
            
            try:
                # 2. Parse Date and normalize (remove time)
                merged_df['Date'] = pd.to_datetime(merged_df['Date'], format='mixed').dt.normalize()
                
                # Keep only specific target columns
                target_pollutants = ["PM2.5", "PM10", "NO2", "NH3", "SO2", "CO", "Ozone"]
                available_pollutants = [col for col in target_pollutants if col in merged_df.columns]
                
                merged_df = merged_df[['Date'] + available_pollutants]
                
                # 3. Numeric conversion and daily aggregation (handles duplicates)
                for col in available_pollutants:
                    merged_df[col] = pd.to_numeric(merged_df[col], errors='coerce')
                merged_df = merged_df.groupby('Date')[available_pollutants].mean().reset_index()
                merged_df = merged_df.sort_values('Date')
                
                # 4. Impute missing values
                merged_df[available_pollutants] = merged_df[available_pollutants].interpolate(method='linear', limit_direction='both').ffill().bfill().fillna(0)
                
                # 5. Feature Engineering: Lags and Moving Averages
                for col in available_pollutants:
                    merged_df[f'{col}_Lag1'] = merged_df[col].shift(1)
                    merged_df[f'{col}_Lag7'] = merged_df[col].shift(7)
                    merged_df[f'{col}_Lag14'] = merged_df[col].shift(14)
                    merged_df[f'{col}_7Day_MA'] = merged_df[col].rolling(window=7, min_periods=1).mean()
                
                merged_df = merged_df.fillna(0)
                merged_df['Month'] = merged_df['Date'].dt.month
                merged_df['Day_of_Week'] = merged_df['Date'].dt.day_name()
                merged_df['Is_Weekend'] = merged_df['Date'].dt.dayofweek.isin([5, 6])
                
                merged_df = merged_df.round(2)
            except Exception as e:
                print(f"  Error during feature engineering for {base_name}: {e}")

            output_file = os.path.join(processed_dir, f"{base_name}.csv")

            try:
                merged_df.to_csv(output_file, index=False)
                print(f"  Successfully processed and saved into {output_file} ({len(merged_df)} rows)\n")
                total_merged += 1
            except Exception as e:
                print(f"  Error saving processed file: {e}\n")
        else:
            print(f"  No valid data found to merge.\n")

    print(f"Done! Processed {total_merged} locations. Files are in {processed_dir}")

if __name__ == "__main__":
    main()


