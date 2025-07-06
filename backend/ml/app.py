from flask import Flask, request, jsonify
import joblib
import numpy as np
import traceback

app = Flask(__name__)

# Load your anomaly detection model
try:
    model = joblib.load("model.pkl")
    print("✅ Model loaded successfully")
except Exception as e:
    print("❌ Error loading model:", str(e))
    model = None

@app.route("/")
def home():
    return "Anomaly Detection API is Running!"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        features = data.get("features")
        print("Python received features (raw):", features) # Added print statement

        if not features or not isinstance(features, list):
            return jsonify({"error": "Invalid input: 'features' must be a list"}), 400

        # Reshape the input for model prediction
        features = np.array(features).reshape(1, -1)
        print("Python features after reshape:", features) # Added print statement

        if not model:
            return jsonify({"error": "Model not loaded"}), 500

        # Example: Assume model returns 0 for normal and 1 for anomaly
        prediction = model.predict(features)[0]
        print(f"Python ML prediction: {prediction}") # ADDED PRINT STATEMENT

        # Optionally, if model has decision_function or predict_proba, use it
        # score = model.decision_function(features)
        # trust_score = 100 - int(score * 100)

        # risk_score = int(prediction * 100)  # This was casting to int too early
        trust_score = 100 - (prediction * 100) # Calculate trust score from float prediction
        print(f"Python calculated trust_score: {trust_score}") # ADDED PRINT STATEMENT

        return jsonify({
            "prediction": prediction, # CHANGED: Send prediction as float
            "trust_score": trust_score
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6000)