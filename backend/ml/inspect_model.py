import joblib

# Load the model
model = joblib.load("model.pkl")

# Try to print feature names (if available)
try:
    print("📌 Feature names:", model.feature_names_in_)
except AttributeError:
    print("⚠️ model.feature_names_in_ not found.")

# Print the model structure anyway
print("\n📦 Model structure:")
print(model)
