from typing import Dict
import random
import hashlib
import base64
import database_client as db
import settings

def create_bloom_app_from_chat_message(message: str, db_client, pipeline: str = settings.OLD_PIPELINE):
    """
    Simulates creating a BloomApp from a chat message and pipeline.
    Returns a BloomApp dict with a unique id, an image from the specified pipeline, and the origin_pipeline.
    """
    # Try to get a random app from the specified pipeline
    pipeline_apps = db_client.read({"origin_pipeline": pipeline})
    
    if pipeline_apps:
        # Get a random app from this pipeline
        app = random.choice(list(pipeline_apps.values()))
        return app
    else:
        # Fallback: raise an error if no apps exist for this pipeline
        raise RuntimeError(f"No apps found for pipeline: {pipeline}")

