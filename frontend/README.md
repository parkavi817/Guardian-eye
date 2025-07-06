# Guardian Eye - Full-Stack E-commerce & Security

This is a Next.js application designed to be the frontend for a Node.js, Express, and MongoDB backend. It features AI-powered security and a complete e-commerce experience.

## Full-Stack Development Setup

To run the complete application, you need to have both the `frontend` and `backend` servers running simultaneously.

### 1. Run the Backend Server

Navigate to your `backend` directory in a terminal and run the following commands:

```bash
# Install backend dependencies
npm install

# Start the Node.js server
node server.js
```
The backend API should now be running on `http://localhost:5000`.

### 2. (Optional) Run the Python ML Microservice

For the anomaly detection to be fully operational, start the Flask service from within the `backend/ml` directory:

```bash
# Navigate to the Python service directory
cd backend/ml

# Install Python dependencies
pip install flask joblib numpy

# Run the Flask service
python app.py
```

### 3. Run the Frontend Server

In a separate terminal, navigate to the `frontend` directory (which is this project's root) and run:

```bash
# The dev script will start the frontend on http://localhost:9002
npm run dev
```

The application is now fully operational. The frontend will automatically proxy API requests to your backend.
