import os
import base64
import hashlib

storage = {}  # simulating a real database in memory with kv

# Simulated in-memory database for bloom apps
apps_db = {}

from typing import Any, Optional

def create(key: str, value: Any) -> None:
    storage[key] = value

def read(query: str | list[str] | dict) -> Optional[Any] | dict[str, Any]:
    """
    Read from storage using various query types.
    
    Args:
        query: Can be:
            - Single key (str)
            - List of keys (list[str]) 
            - Dict query (dict) - filters results based on key-value pairs
            
    Returns:
        If single key: the value or None if not found
        If multiple keys: dict mapping keys to values (None for missing keys)
        If dict query: filtered results matching the query criteria
    """
    if isinstance(query, str):
        return storage.get(query)
    elif isinstance(query, list):
        return {key: storage.get(key) for key in query}
    elif isinstance(query, dict):
        # Handle dict queries - filter storage based on key-value pairs
        results = {}
        for key, value in storage.items():
            if isinstance(value, dict):
                # Check if all query conditions match
                matches = True
                for query_key, query_value in query.items():
                    if query_key not in value or value[query_key] != query_value:
                        matches = False
                        break
                if matches:
                    results[key] = value
        return results
    else:
        raise TypeError("query must be a string, list of strings, or dict")

def update(key: str, value: Any) -> bool:
    if key in storage:
        storage[key] = value
        return True
    return False

def delete(key: str) -> bool:
    if key in storage:
        del storage[key]
        return True
    return False

def init():
    """
    Initialize the database with bloom apps from the resource directory.
    
    Database Schema:
    storage = {
        "bloom_apps": {
            "image_hash": {
                "id": str,           # SHA256 hash of the image
                "image": str,        # Base64 encoded image data URL
                "origin_pipeline": str  # Pipeline name (subfolder name)
            }
        },
        "pipeline_ids": [str]        # List of unique pipeline names
    }
    """
    resource_dir = os.path.join(os.path.dirname(__file__), "resroucre")
    if not os.path.exists(resource_dir):
        raise RuntimeError(f"Resource directory does not exist: {resource_dir}")

    # Initialize pipeline_ids list
    pipeline_ids = []
    
    for root, dirs, files in os.walk(resource_dir):
        for name in files:
            file_path = os.path.join(root, name)
            # Get the immediate subfolder name as the pipeline
            rel_path = os.path.relpath(file_path, resource_dir)
            parts = rel_path.split(os.sep)
            origin_pipeline = parts[0] if len(parts) > 1 else "unknown"
            
            # Add pipeline to pipeline_ids if not already present
            if origin_pipeline not in pipeline_ids:
                pipeline_ids.append(origin_pipeline)
                
            with open(file_path, "rb") as f:
                image_bytes = f.read()
                image_hash = hashlib.sha256(image_bytes).hexdigest()
                encoded_image = base64.b64encode(image_bytes).decode("utf-8")
                
                app = {
                    "id": image_hash,
                    "image": f"data:image/png;base64,{encoded_image}",
                    "origin_pipeline": origin_pipeline
                }
                
                if "bloom_apps" not in storage:
                    storage["bloom_apps"] = {}
                storage["bloom_apps"][image_hash] = app
                print(f"Loaded app: {name} (id: {image_hash}, pipeline: {origin_pipeline})")
    
    # Store pipeline_ids in storage
    storage["pipeline_ids"] = pipeline_ids
    print(f"Found pipelines: {pipeline_ids}")

def add_app(app):
    apps_db[app['id']] = app

def read_apps():
    return apps_db

init()