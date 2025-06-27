from flask import Flask, request, jsonify
import base64
import uuid
import random
from flask_cors import CORS
from datatypes import BloomApp 
import database_client as db
import bloom
import ab_test

app = Flask(__name__)
CORS(app)

@app.route("/api/app", methods=["POST"])
def handle_bloom_chat_messgae():
    data = request.get_json()
    chat_message = data.get('message')
    print("Received message:", data.get("message"))
    
    
    is_ab_test = ab_test.is_ab_test(data)
    
    # Use ab_test module to handle A/B test logic
    if is_ab_test:
        public_apps = ab_test.get_ab_test_apps(data, db)
    else:
        public_apps = bloom.create_bloom_app_from_chat_message(chat_message, db)
    
    return jsonify({"apps": public_apps})

@app.route("/api/app/selection", methods=["POST"])
def capture_app_selection_event():
    data = request.get_json()
    selected_id = data.get("selected_id")
    choices: list[str] = data.get("choices")  # list of app ids
    user_id = data.get("user_id")  # optional, if you want to track user

    # For demonstration, just print the event. In production, store in DB or log.
    print(f"User selected app: {selected_id} from choices: {choices} (user_id: {user_id})")

    # Optionally, you could return some confirmation or next step
    return jsonify({"status": "success", "selected_id": selected_id}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
    
    
