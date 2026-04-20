from typing import Optional
from ..core.storage import BaseStorageBackend, JSONFileStorage
class MemoryConfig:
    """
    Configuration for memory management.
    """
    def __init__(
        self,
        max_tokens: int = 4096,
        max_messages: Optional[int] = None,
        kv_cache_size: int = 10,
        auto_save: bool = True,
        storage_backend: Optional[BaseStorageBackend] = None,
        storage_dir: str = ""
    ):
        """
        Initialize memory configuration.
        
        Args:
            max_tokens: Maximum tokens in active memory before saving
            max_messages: Maximum messages in active memory (None for unlimited)
            kv_cache_size: Number of recent messages to keep in KV cache
            auto_save: Whether to auto-save when limit exceeded
            storage_dir: Directory to save chat sessions
        """
        self.max_tokens = max_tokens
        self.max_messages = max_messages
        self.kv_cache_size = kv_cache_size
        self.auto_save = auto_save
        
        # Initialize backend, falling back to JSON if none provided
        if storage_backend:
            self.storage_backend = storage_backend
        else:
            self.storage_backend = JSONFileStorage(storage_dir or "./agent_chats")
