from flask import Flask, request, jsonify
from flask_cors import CORS
import database_client as db
import bloom
import ab_test
import posthog_client
from dotenv import load_dotenv
import requests
import os

load_dotenv('.env.local')


app = Flask(__name__)
CORS(app)

@app.route("/api/hello", methods=["GET"])
def hello_world():
    return jsonify({"message": "Hello, World!"})


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
    app_selections = data.get("app_selections")  # list of dicts with app_id and is_selected
    user_id = data.get("user_id")  # optional, if you want to track user

    # For demonstration, just print the event. In production, store in DB or log.
    print(f"User selected app: {selected_id} from choices: {choices} (user_id: {user_id})")
    
    # Print each app's selection status
    if app_selections:
        print("App selection details:")
        for app_selection in app_selections:
            app_id = app_selection.get("app_id")
            is_selected = app_selection.get("is_selected")
            status = "SELECTED" if is_selected else "NOT SELECTED"
            print(f"  - App {app_id}: {status}")

    # Send PostHog event
    event_properties = {
        "selected_app_id": selected_id,
        "total_choices": len(choices),
        "choices": choices,
        "app_selections": app_selections
    }
    
    posthog_client.capture_private_event(
        event="app_selected",
        distinct_id=user_id or "anonymous",
        properties=event_properties
    )

    # Optionally, you could return some confirmation or next step
    return jsonify({"status": "success", "selected_id": selected_id, "app_selections": app_selections}), 200

@app.route("/api/abtest/events", methods=["GET"])
def get_abtest_events():
    from posthog_client import fetch_events
    event_name = "ab_test_origin_pipeline"
    after = request.args.get("after")
    before = request.args.get("before")
    limit = int(request.args.get("limit", 100))
    
    try:
        print(f"Fetching events with params: event_name={event_name}, after={after}, before={before}, limit={limit}")
        events = fetch_events(event_name=event_name, after=after, before=before, limit=limit)
        print(f"Successfully fetched {len(events.get('results', []))} events")
        return jsonify(events)
    except Exception as e:
        print(f"Error in get_abtest_events: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "details": "Check server logs for more information"}), 500

@app.route("/api/project-info", methods=["GET"])
def get_project_info():
    """Helper endpoint to get project information"""
    
    project_api_key = os.getenv('PUBLIC_POSTHOG_KEY')
    host = os.getenv('PUBLIC_POSTHOG_DOMAIN', 'https://us.i.posthog.com')
    
    if not project_api_key:
        return jsonify({"error": "PUBLIC_POSTHOG_KEY not set"}), 400
    
    try:
        # Try to get project info using the project API key
        url = f"{host}/api/projects/"
        headers = {
            "Authorization": f"Bearer {project_api_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers)
        print(f"Project info response status: {response.status_code}")
        print(f"Project info response: {response.text}")
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": f"Failed to get project info: {response.status_code}", "response": response.text}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5328)
    
    
