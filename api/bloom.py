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
    # Get all bloom apps from storage
    all_apps = db_client.read("bloom_apps")
    
    if not all_apps:
        raise RuntimeError("No bloom apps found in database")
    
    # Filter apps by the specified pipeline
    pipeline_apps = {}
    for app_id, app_data in all_apps.items():
        if app_data.get("origin_pipeline") == pipeline:
            pipeline_apps[app_id] = app_data
    
    if pipeline_apps:
        # Get a random app from this pipeline
        app = random.choice(list(pipeline_apps.values()))
        return [app]
    else:
        # Fallback: raise an error if no apps exist for this pipeline
        raise RuntimeError(f"No apps found for pipeline: {pipeline}")

