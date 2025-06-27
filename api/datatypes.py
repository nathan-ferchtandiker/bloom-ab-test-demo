from typing import TypedDict

class BloomApp(TypedDict):
    id: str
    image: str
    origin_pipeline: str  # Indicates how the app was created 