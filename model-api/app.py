from flask import Flask, request, jsonify, send_from_directory
import pandas as pd
import numpy as np
import pickle
from pathlib import Path

app = Flask(__name__)

MODEL_PATH = Path(__file__).resolve().parent / "rf_rainfall_model.pkl"
FORECAST_MONTHS = 3

with open(MODEL_PATH, "rb") as f:
    bundle = pickle.load(f)

models = bundle["models"]
FEATURES = bundle["features"]
LOWER_PERCENTILE, UPPER_PERCENTILE = bundle["interval_percentiles"]

print("ฝึกสอนด้วยข้อมูล", bundle["train_start"], "ถึง", bundle["train_end"])

def forecast_province(province, months):
    model = models[province]

    X = pd.DataFrame({"month": months})

    if hasattr(model, "feature_names_in_"):
        X = X[list(model.feature_names_in_)]

    predicted = model.predict(X)

    tree_predictions = np.array([
        tree.predict(X.to_numpy()) for tree in model.estimators_
    ])
    lower = np.percentile(tree_predictions, LOWER_PERCENTILE, axis=0)
    upper = np.maximum(np.percentile(tree_predictions, UPPER_PERCENTILE, axis=0), predicted)

    results = []
    for i, month in enumerate(months):
        results.append({
            "month": int(month),
            "predicted_rain": round(float(predicted[i]), 2),
            "predicted_rain_lower": round(float(lower[i]), 2),
            "predicted_rain_upper": round(float(upper[i]), 2),
        })
    return results

@app.get("/")
def home():
    return send_from_directory(".", "index.html")

@app.get("/provinces")
def provinces():
    return jsonify({"provinces": sorted(models.keys()), "count": len(models)})

@app.post("/predict")
def predict():
    data = request.get_json(force=True)

    
    province = str(data.get("province", "")).strip()
    months = data.get("months")

    if province not in models:
        return jsonify({"error": "ไม่พบจังหวัด '%s'" % province}), 400

    if not months:
        last_month = int(data.get("last_actual_month", 0))
        if last_month < 1 or last_month > 12:
            return jsonify({"error": "ต้องระบุ months หรือ last_actual_month"}), 400
        months = [(last_month + i - 1) % 12 + 1 for i in range(1, FORECAST_MONTHS + 1)]

    months = [int(m) for m in months]
    for m in months:
        if m < 1 or m > 12:
            return jsonify({"error": "เดือนต้องอยู่ระหว่าง 1 ถึง 12"}), 400

    return jsonify({
        "province": province,
        "region": bundle["province_to_region"][province],
        "train_start": bundle["train_start"],
        "train_end": bundle["train_end"],
        "forecast": forecast_province(province, months),
    })

@app.post("/forecast-all")
def forecast_all():
    data = request.get_json(force=True)

    last_year = int(data.get("last_actual_year", 0))
    last_month = int(data.get("last_actual_month", 0))

    if last_year < 2000 or last_month < 1 or last_month > 12:
        return jsonify({"error": "ระบุ last_actual_year และ last_actual_month"}), 400

    periods = []
    index = last_year * 12 + last_month
    for step in range(1, FORECAST_MONTHS + 1):
        nxt = index + step
        periods.append(((nxt - 1) // 12, (nxt - 1) % 12 + 1))

    months = [month for _, month in periods]
    rows = []

    for province in sorted(models.keys()):
        values = forecast_province(province, months)
        for i, (year, month) in enumerate(periods):
            rows.append({
                "province": province,
                "year": year,
                "month": month,
                "horizon_months": i + 1,
                "predicted_rain": values[i]["predicted_rain"],
                "predicted_rain_lower": values[i]["predicted_rain_lower"],
                "predicted_rain_upper": values[i]["predicted_rain_upper"],
            })

    return jsonify({
        "train_start": bundle["train_start"],
        "train_end": bundle["train_end"],
        "count": len(rows),
        "forecast": rows,
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
