from typing import Dict
import random

def create_bloom_app_from_chat_message(message: str, db) -> Dict[str, str]:
    """
    Simulates creating a BloomApp from a chat message.
    Returns a BloomApp dict with a unique id, a placeholder image, and the origin_pipeline as 'chat'.
    """

    # Use the message to generate a unique id
    
    bloom_apps = db.read("bloom_apps")
    if not bloom_apps:
        return None
    return random.choice(list(bloom_apps.values()))

def read_random_bloom_app_from_db(db):
    """
    Reads a random BloomApp from the database (db).
    Returns a BloomApp dict or None if no apps exist.
    """
    bloom_apps = db.read("bloom_apps")
    if not bloom_apps:
        return None
    return random.choice(list(bloom_apps.values()))

