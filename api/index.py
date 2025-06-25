from flask import Flask, request, jsonify
import base64
import uuid
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/api/app", methods=["POST"])
def hello_world():
    data = request.get_json()
    print("Received message:", data.get("message"))
    app1_id = str(uuid.uuid4())
    app2_id = str(uuid.uuid4())
    with open("api/resroucre/a/1.png", "rb") as image_file:
        encoded1 = base64.b64encode(image_file.read()).decode("utf-8")
    with open("api/resroucre/b/3.png", "rb") as image_file:
        encoded2 = base64.b64encode(image_file.read()).decode("utf-8")
    apps = [
        {"id": app1_id, "image": f"data:image/png;base64,{encoded1}"},
        {"id": app2_id, "image": f"data:image/png;base64,{encoded2}"}
    ]
    return jsonify({"apps": apps})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)