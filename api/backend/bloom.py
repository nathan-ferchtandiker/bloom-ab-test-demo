from typing import Dict
import random
import hashlib
import base64
from backend import database_client as db
from backend import settings
import uuid
import os

def create_bloom_app_from_chat_message(message: str, db_client, pipeline: str = settings.OLD_PIPELINE):
    """
    Simulates creating a BloomApp from a chat message and pipeline.
    Picks a random image from the pipeline folder, assigns a UUID, and stores it in the in-memory database.
    Returns a base64 data URL for the image (not a file path).
    """
    # Find the pipeline folder - now need to go up one level since we're in backend/
    resource_dir = os.path.join(os.path.dirname(__file__), "..", "resroucre", pipeline)
    images = [f for f in os.listdir(resource_dir) if f.endswith('.png')]
    if not images:
        raise RuntimeError(f"No images found for pipeline: {pipeline}")
    chosen_image = random.choice(images)
    image_path = os.path.join(resource_dir, chosen_image)

    # Read and encode the image as base64 data URL
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
        encoded_image = base64.b64encode(image_bytes).decode('utf-8')
        image_data_url = f"data:image/png;base64,{encoded_image}"

    # Generate a UUID for the app/image ID
    app_id = str(uuid.uuid4())

    # Store in the in-memory database
    app = {
        'id': app_id,
        'image': image_data_url,  # Return the data URL, not the file path
        'origin_pipeline': pipeline,
        'message': message
    }
    db.add_app(app)

    # Return the new app in a list (to match previous return type)
    return [app]

