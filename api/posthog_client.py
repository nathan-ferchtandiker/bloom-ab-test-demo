import posthog
import os
import json
import requests
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv('.env.local')


class PrivatePostHogClient:
    """Client for PostHog private API (server-side events)"""
    
    def __init__(self):
        self.api_key = os.getenv('PRIVATE_POSTHOG_KEY')
        self.host = os.getenv('PRIVATE_POSTHOG_DOMAIN', 'https://us.i.posthog.com')
        
        if self.api_key:
            self.enabled = True
        else:
            print("Warning: PRIVATE_POSTHOG_KEY not set. PostHog private events will not be sent.")
            self.enabled = False
    
    def capture(self, event: str, distinct_id: str, properties: Optional[Dict[str, Any]] = None, timestamp: Optional[str] = None):
        """
        Capture a PostHog event using the private API.
        
        Args:
            event: The event name
            distinct_id: The user ID
            properties: Optional event properties
            timestamp: Optional timestamp in ISO 8601 format
        """
        if not self.enabled:
            print(f"PostHog private disabled - would send event: {event} for user: {distinct_id}")
            if properties:
                print(f"Properties: {properties}")
            return
        
        try:
            url = f"{self.host}/i/v0/e/"
            headers = {
                "Content-Type": "application/json"
            }
            
            payload = {
                "api_key": self.api_key,
                "event": event,
                "distinct_id": distinct_id,
                "properties": properties or {}
            }
            
            if timestamp:
                payload["timestamp"] = timestamp
            
            response = requests.post(url, headers=headers, data=json.dumps(payload))
            response.raise_for_status()
            print(f"PostHog private event sent: {event} for user: {distinct_id}")
        except Exception as e:
            print(f"Error sending PostHog private event: {e}")


# Create global instance
posthog_private_client = PrivatePostHogClient()


def capture_private_event(event: str, distinct_id: str, properties: Optional[Dict[str, Any]] = None, timestamp: Optional[str] = None):
    """
    Convenience function to capture a PostHog event using the private client.
    
    Args:
        event: The event name
        distinct_id: The user ID
        properties: Optional event properties
        timestamp: Optional timestamp in ISO 8601 format
    """
    posthog_private_client.capture(event, distinct_id, properties, timestamp)


def fetch_events(event_name: str = None, after: str = None, before: str = None, limit: int = 100):
    """
    Fetch events from PostHog using the private API.
    Args:
        event_name: Filter by event name (optional)
        after: ISO date string for filtering events after this date (optional)
        before: ISO date string for filtering events before this date (optional)
        limit: Max number of events to fetch (default 100)
    Returns:
        JSON response from PostHog API
    """
    personal_api_key = os.getenv('POSTHOG_PERSONAL_API_KEY')
    project_id = os.getenv('POSTHOG_PROJECT_ID')
    host = os.getenv('PRIVATE_POSTHOG_DOMAIN', 'https://us.posthog.com')
    if not personal_api_key or not project_id:
        raise Exception('POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID must be set in environment')
    url = f"{host}/api/projects/{project_id}/events/"
    headers = {
        "Authorization": f"Bearer {personal_api_key}",
        "Content-Type": "application/json"
    }
    params = {
        "limit": limit,
        "format": "json"
    }
    if event_name:
        params["event"] = event_name
    if after:
        params["after"] = after
    if before:
        params["before"] = before
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()

