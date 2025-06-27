import os
import base64
import hashlib

storage = {}  # simulating a real database in memory with kv


from typing import Any, Optional

def create(key: str, value: Any) -> None:
    storage[key] = value

def read(key: str) -> Optional[Any]:
    return storage.get(key)

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
    resource_dir = os.path.join(os.path.dirname(__file__), "resroucre")
    if not os.path.exists(resource_dir):
        raise RuntimeError(f"Resource directory does not exist: {resource_dir}")

    for root, dirs, files in os.walk(resource_dir):
        for name in files:
            file_path = os.path.join(root, name)
            # Get the immediate subfolder name as the pipeline
            rel_path = os.path.relpath(file_path, resource_dir)
            parts = rel_path.split(os.sep)
            origin_pipeline = parts[0] if len(parts) > 1 else "unknown"
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

init()