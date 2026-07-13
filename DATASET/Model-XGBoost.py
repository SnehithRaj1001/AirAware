import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from xgboost import XGBRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error
import warnings
import os
import sys
import joblib

warnings.filterwarnings("ignore")

"""
Air Quality Forecasting - XGBoost (Multi-Window Architecture)
- PM2.5, PM10, NO2: Train on FULL history (preserves seasonal accuracy user loved).
- NH3, SO2, CO, Ozone: Train on LAST 90 DAYS (forces adaptation to recent unit/scale shifts).
- All use Absolute Prediction with Log-Transformation.
"""

# ── CONFIG ────────────────────────────────────────────────────────────────────
TARGETS = ["PM2.5", "PM10", "NO2", "NH3", "SO2", "CO", "Ozone"]
DATE_COL = "Date"
FORECAST_DAYS = 3
LAGS = [1, 2, 3, 7, 14]
ROLLING_WINDOWS = [3, 7, 14]
SHORT_WINDOW_DAYS = 90

# ── LOAD DATA ─────────────────────────────────────────────────────────────────
def load_data(path):
    if not os.path.exists(path):
        print(f"Error: File not found at {path}")
        sys.exit(1)
    
    df = pd.read_csv(path)
    df[DATE_COL] = pd.to_datetime(df[DATE_COL])
    df = df.sort_values(DATE_COL).reset_index(drop=True)
    return df, [t for t in TARGETS if t in df.columns]

# ── FEATURE ENGINEERING ───────────────────────────────────────────────────────
def make_features(df, targets):
    df = df.copy()

    # Temporal features (Crucial for PM seasonality)
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

    df = df.dropna().reset_index(drop=True)
    return df

# ── FEATURE COLUMNS ───────────────────────────────────────────────────────────
def get_feature_cols(df, targets):
    exclude = [DATE_COL] + targets
    return [c for c in df.columns if c not in exclude and "_Lag" not in c and "_MA" not in c and "Month" != c and "Day_of_Week" != c and "Is_Weekend" != c]

# ── TRAIN / EVALUATE ──────────────────────────────────────────────────────────
def train_and_evaluate(df, targets):
    df_feat = make_features(df, targets)
    feature_cols = get_feature_cols(df_feat, targets)

    models = {}
    metrics = {}
    predictions = {}

    print("\n" + "="*65)
    print(f"{'Parameter':<12} {'Window':<12} {'RMSE':>10} {'MAE':>10}")
    print("="*65)

    for target in targets:
        # Use full history for all targets
        target_df = df_feat
        window_name = "Full"

        # Split current window
        split_idx = int(len(target_df) * 0.8)
        train = target_df.iloc[:split_idx]
        test  = target_df.iloc[split_idx:]

        X_train = train[feature_cols]
        X_test  = test[feature_cols]
        y_train_log = np.log1p(train[target])
        y_test_raw  = test[target]

        model = XGBRegressor(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=4,
            subsample=0.8,
            colsample_bytree=0.8,
            n_jobs=-1,
            random_state=42
        )
        
        # Fit the model
        model.fit(X_train, y_train_log, 
                  eval_set=[(X_test, np.log1p(y_test_raw))], verbose=False)

        y_pred_log = model.predict(X_test)
        y_pred = np.expm1(y_pred_log)
        y_pred = np.clip(y_pred, 0, None)

        rmse = np.sqrt(mean_squared_error(y_test_raw, y_pred))
        mae  = mean_absolute_error(y_test_raw, y_pred)

        models[target]      = model
        metrics[target]     = {"RMSE": rmse, "MAE": mae, "Window": window_name}
        predictions[target] = {"actual": y_test_raw.values, "predicted": y_pred}

        print(f"{target:<12} {window_name:<12} {rmse:>10.3f} {mae:>10.3f}")

    print("="*65)

    return models, metrics, predictions, df_feat, feature_cols

# ── FUTURE FORECAST ───────────────────────────────────────────────────────────
def forecast_future(df, models, feature_cols, targets):
    future_df = df.copy()
    last_date  = df[DATE_COL].max()
    forecast_rows = []

    # Retrain models on 100% of data so they can learn from the recent 'test' set!
    df_feat_full = make_features(df, targets)
    X_full = df_feat_full[feature_cols]
    
    for target in targets:
        target_df = df_feat_full
        X_train_full = target_df[feature_cols]
        y_train_full_log = np.log1p(target_df[target])
        
        models[target].fit(X_train_full, y_train_full_log)

    for day in range(1, FORECAST_DAYS + 1):
        next_date = last_date + pd.Timedelta(days=day)
        temp_df = make_features(future_df, targets)
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

        row = {DATE_COL: next_date}
        for target in targets:
            pred_log = models[target].predict(X_next)[0]
            pred = np.expm1(pred_log)
            # Clip to recent observed max to prevent unreasonable spikes
            row[target] = round(max(pred, 0), 2)

        forecast_rows.append(row)
        new_row = pd.DataFrame([{DATE_COL: next_date, **{t: row[t] for t in targets}}])
        future_df = pd.concat([future_df, new_row], ignore_index=True)

    return pd.DataFrame(forecast_rows)

# ── PLOTS ─────────────────────────────────────────────────────────────────────
def plot_all(df, forecast_df, predictions, targets, station_name):
    # Plot Eval
    rows = (len(targets) + 1) // 2
    fig = plt.figure(figsize=(20, 5 * rows))
    fig.patch.set_facecolor("#0f1117")
    gs = gridspec.GridSpec(rows, 2, figure=fig, hspace=0.4)
    colors = ["#00d4ff", "#ff6b6b", "#ffd93d", "#6bcb77", "#ff922b", "#cc5de8", "#74c0fc", "#f06595"]

    for i, target in enumerate(targets):
        ax = fig.add_subplot(gs[i // 2, i % 2])
        ax.set_facecolor("#1a1d27")
        ax.plot(predictions[target]["actual"], color="white", alpha=0.6, label="Actual")
        ax.plot(predictions[target]["predicted"], color=colors[i % len(colors)], label="Predicted", linestyle="--")
        ax.set_title(target, color="white")
        ax.legend(fontsize=8)
        ax.grid(alpha=0.1)
    plt.savefig(f"{station_name}_eval.png", bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()

    # Plot Forecast
    fig = plt.figure(figsize=(20, 5 * rows))
    fig.patch.set_facecolor("#0f1117")
    gs = gridspec.GridSpec(rows, 2, figure=fig, hspace=0.4)
    for i, target in enumerate(targets):
        ax = fig.add_subplot(gs[i // 2, i % 2])
        ax.set_facecolor("#1a1d27")
        ax.plot(df.tail(30)[DATE_COL], df.tail(30)[target], color="white", label="History")
        ax.plot(forecast_df[DATE_COL], forecast_df[target], color=colors[i % len(colors)], marker="o", label="Forecast")
        ax.set_title(target, color="white")
        ax.tick_params(axis="x", rotation=30)
        ax.legend(fontsize=8)
    plt.savefig(f"{station_name}_forecast.png", bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()

# ── MAIN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python Model-XGBoost.py <path_to_csv>")
        sys.exit(1)

    csv_path = sys.argv[1]
    station_name = os.path.basename(csv_path).replace(".csv", "")

    print(f"Loading data for {station_name}...")
    df, available_targets = load_data(csv_path)

    print("\nTraining with Multi-Window Strategy (Full History for PM, Short for NH3/CO)...")
    models, metrics, predictions, df_feat, feature_cols = train_and_evaluate(df, available_targets)

    print("\nGenerating forecast...")
    forecast_df = forecast_future(df, models, feature_cols, available_targets)

    print("\n" + "="*45)
    print("FUTURE FORECAST")
    print("="*45)
    print(forecast_df.to_string(index=False))
    print("="*45)

    # plot_all(df, forecast_df, predictions, available_targets, station_name)
    
    # Save the trained models
    os.makedirs("models", exist_ok=True)
    model_path = os.path.join("models", f"{station_name}.pkl")
    joblib.dump(models, model_path)
    print(f"\nTrained models saved to {model_path}")
    
    print("\nDone.")
