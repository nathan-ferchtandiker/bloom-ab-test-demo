from flask import Flask, request, jsonify
import base64
import uuid
from flask_cors import CORS
from datatypes import BloomApp 
import database_client as db

app = Flask(__name__)
CORS(app)

@app.route("/api/app", methods=["POST"])
def handle_bloom_chat_messgae():
    data = request.get_json()
    print("Received message:", data.get("message"))
    app1_id = str(uuid.uuid4())
    app2_id = str(uuid.uuid4())
    with open("api/resroucre/a/1.png", "rb") as image_file:
        encoded1 = base64.b64encode(image_file.read()).decode("utf-8")
    with open("api/resroucre/b/3.png", "rb") as image_file:
        encoded2 = base64.b64encode(image_file.read()).decode("utf-8")
    apps: list[BloomApp] = [
        {"id": app1_id, "image": f"data:image/png;base64,{encoded1}", "origin_pipeline": "default_pipeline"},
        {"id": app2_id, "image": f"data:image/png;base64,{encoded2}", "origin_pipeline": "default_pipeline"}
    ]
    # Only send id and image to the client
    public_apps = [{"id": app["id"], "image": app["image"]} for app in apps]
    return jsonify({"apps": public_apps})

@app.route("/api/app/selection", methods=["POST"])
def capture_app_selection():
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
    
    
