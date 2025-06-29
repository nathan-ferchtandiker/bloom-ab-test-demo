import random
from . import database_client as db
from . import bloom
from . import settings



def is_ab_test(data):
    """
    Determines if the request should be an A/B test.
    Currently returns 50% chance, but can be extended with more sophisticated logic.
    """
    return random.choice([True, False])

def get_ab_test_apps(data, db_client):
    """
    Returns 2 random apps from different pipelines for A/B testing.
    Falls back to creating a single app if not enough apps are available.
    """
    # Get one app from each of two different pipelines
    selected_pipelines = [settings.OLD_PIPELINE, settings.NEW_PIPELINE]
    created_bloom_apps = []
    for pipeline in selected_pipelines:
            # Fallback: create a new app using bloom
            app = bloom.create_bloom_app_from_chat_message(data.get("message", ""), db_client, pipeline)
            created_bloom_apps += app
    
    # Shuffle the apps to randomize the order for A/B testing
    random.shuffle(created_bloom_apps)
    return created_bloom_apps