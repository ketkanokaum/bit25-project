import json
import pickle
from pathlib import Path

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "rf_rainfall_model.pkl"
OUTPUT_PATH = BASE_DIR / "forecast_table.json"
WEB_OUTPUT_PATH = BASE_DIR.parent / "lib" / "data" / "forecast-table.json"
MONTHS = list(range(1, 13))


def forecast_province(model, months, lower_percentile, upper_percentile):
    X = pd.DataFrame({"month": months})

    if hasattr(model, "feature_names_in_"):
        X = X[list(model.feature_names_in_)]

    predicted = model.predict(X)

    input_values = X.to_numpy()
    tree_predictions = []

    for tree in model.estimators_:
        prediction = tree.predict(input_values)
        tree_predictions.append(prediction)

    tree_predictions = np.array(tree_predictions)
    lower = np.percentile(tree_predictions, lower_percentile, axis=0)
    upper = np.maximum(np.percentile(tree_predictions, upper_percentile, axis=0), predicted)

    results = []
    for i, month in enumerate(months):
        results.append({
            "month": int(month),
            "predicted_rain": round(float(predicted[i]), 2),
            "predicted_rain_lower": round(float(lower[i]), 2),
            "predicted_rain_upper": round(float(upper[i]), 2),
        })
    return results


def main():
    with open(MODEL_PATH, "rb") as f:
        bundle = pickle.load(f)

    models = bundle["models"]
    lower_percentile, upper_percentile = bundle["interval_percentiles"]

    table = {}
    for province in sorted(models.keys()):
        rows = forecast_province(models[province], MONTHS, lower_percentile, upper_percentile)
        table[province] = {str(row["month"]): row for row in rows}

    output = {
        "features": bundle["features"],
        "train_start": bundle["train_start"],
        "train_end": bundle["train_end"],
        "interval_percentiles": [lower_percentile, upper_percentile],
        "province_to_region": bundle["province_to_region"],
        "months": MONTHS,
        "table": table,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

    with open(WEB_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = OUTPUT_PATH.stat().st_size / 1024
    print("เขียน %s และ %s แล้ว: %d จังหวัด x %d เดือน (%.1f KB)"
          % (OUTPUT_PATH.name, WEB_OUTPUT_PATH.name, len(table), len(MONTHS), size_kb))


if __name__ == "__main__":
    main()
