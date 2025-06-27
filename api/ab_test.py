import random
import database_client as db

def is_ab_test(data):
    """
    Determines if the request should be an A/B test.
    Currently returns 50% chance, but can be extended with more sophisticated logic.
    """
    return random.choice([True, False])

def get_ab_test_apps(data, db_client):
    """
    Returns 2 random apps from the database for A/B testing.
    Falls back to creating a single app if not enough apps are available.
    """
    bloom_apps = db_client.read("bloom_apps")
    if bloom_apps and len(bloom_apps) >= 2:
        available_apps = list(bloom_apps.values())
        selected_apps = random.sample(available_apps, 2)
        return [{"id": app["id"], "image": app["image"]} for app in selected_apps]
    else:
        # Fallback to single app if not enough apps in database
        import bloom
        app_obj = bloom.create_bloom_app_from_chat_message(data.get("message", ""), db_client)
        return [{"id": app_obj["id"], "image": app_obj["image"]}]

def get_single_app(data, db_client):
    """
    Returns a single app created from the chat message.
    """
    import bloom
    app_obj = bloom.create_bloom_app_from_chat_message(data.get("message", ""), db_client)
    return [{"id": app_obj["id"], "image": app_obj["image"]}]
