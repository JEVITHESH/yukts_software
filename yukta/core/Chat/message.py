"""
Message Module
Defines message structure and roles for agent conversations.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum
import json
import logging

# Import token analyzer for accurate token counting
try:
    from ..token_analyzer import TokenAnalyzer, get_token_analyzer
    HAS_TIKTOKEN = True
except ImportError:
    HAS_TIKTOKEN = False

# Configure logging
logger = logging.getLogger(__name__)


def _make_json_serializable(obj: Any) -> Any:
    """
    Recursively convert objects to JSON-serializable format.
    Handles protobuf objects, enums, repeated fields, and other non-serializable types.
    
    Args:
        obj: Object to convert
        
    Returns:
        JSON-serializable version of the object
    """
    # Handle None
    if obj is None:
        return None
    
    # Handle basic JSON-serializable types
    if isinstance(obj, (str, int, float, bool)):
        return obj
    
    # Handle lists
    if isinstance(obj, (list, tuple)):
        return [_make_json_serializable(item) for item in obj]
    
    # Handle dictionaries
    if isinstance(obj, dict):
        return {
            _make_json_serializable(k): _make_json_serializable(v)
            for k, v in obj.items()
        }
    
    # Handle protobuf objects
    if hasattr(obj, 'DESCRIPTOR'):
        return _make_json_serializable(obj.__dict__)
    
    # Handle protobuf repeated fields (RepeatedScalarContainer, RepeatedCompositeContainer)
    if type(obj).__name__ in ('RepeatedScalarContainer', 'RepeatedCompositeContainer'):
        return [_make_json_serializable(item) for item in obj]
    
    # Handle enums
    if hasattr(obj, 'value'):
        try:
            return str(obj.value)
        except:
            pass
    
    # Handle objects with __dict__
    if hasattr(obj, '__dict__'):
        try:
            return _make_json_serializable(obj.__dict__)
        except:
            pass
    
    # Fallback: convert to string
    try:
        return str(obj)
    except:
        return None


class Role(Enum):
    """Message roles in conversation."""
    SYSTEM = "system"
    USER = "user"
    AGENT = "agent"
    TOOL = "tool"


class Message:
    """
    Represents a single message in a conversation.
    
    A message contains the role (system/user/agent/tool), content,
    optional tool calls, and metadata for tracking and analysis.
    
    Attributes:
        role: Message role (system, user, agent, tool)
        content: Message content/text
        tool_calls: Optional list of tool calls made by agent
        tool_call_id: Optional ID if this is a tool response
        metadata: Additional metadata (tags, context, etc.)
        timestamp: When the message was created
        token_count: Estimated token count
        message_id: Unique message identifier
    """
    
    def __init__(
        self,
        role: str,
        content: str,
        tool_calls: Optional[List[Dict[str, Any]]] = None,
        tool_call_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        message_id: Optional[str] = None
    ):
        """
        Initialize a message.
        
        Args:
            role: Message role (system, user, agent, tool)
            content: Message content (will be converted to string if not already)
            tool_calls: Tool calls if agent is requesting tool use
            tool_call_id: ID of tool call this message responds to
            metadata: Additional metadata
            message_id: Unique ID (auto-generated if not provided)
        """
        # Validate role
        if role not in [r.value for r in Role]:
            raise ValueError(f"Invalid role: {role}. Must be one of {[r.value for r in Role]}")
        
        self.role = role
        # Ensure content is always a string
        if not isinstance(content, str):
            # Clean protobuf objects and other non-serializable types first
            try:
                cleaned_content = _make_json_serializable(content)
                self.content = json.dumps(cleaned_content) if isinstance(cleaned_content, (dict, list)) else str(cleaned_content)
            except Exception as e:
                # Fallback: just convert to string
                self.content = str(content)
        else:
            self.content = content
        self.tool_calls = tool_calls or []
        self.tool_call_id = tool_call_id
        self.metadata = metadata or {}
        self.timestamp = datetime.now()
        self.message_id = message_id or self._generate_id()
        self.token_count = self._estimate_tokens()
    
    def _generate_id(self) -> str:
        """Generate a unique message ID."""
        return f"msg_{self.timestamp.strftime('%Y%m%d_%H%M%S_%f')}"
    
    def _estimate_tokens(self) -> int:
        """
        Estimate token count for the message using tiktoken if available.
        Falls back to character-based estimation if tiktoken is not available.
        
        Returns:
            Estimated token count
        """
        # Ensure content is a string (should always be, but be safe)
        content_str = self.content if isinstance(self.content, str) else str(self.content)
        
        # Try to use tiktoken for accurate counting
        if HAS_TIKTOKEN:
            try:
                analyzer = get_token_analyzer()
                token_count = analyzer.count_tokens(content_str)
                
                # Add tokens for tool calls
                if self.tool_calls:
                    try:
                        tool_calls_str = json.dumps(self.tool_calls)
                        token_count += analyzer.count_tokens(tool_calls_str)
                    except:
                        pass
                
                # Add 4 tokens for message overhead
                token_count += 4
                return max(1, token_count)
            except Exception as e:
                logger.debug(f"Tiktoken counting failed: {e}. Using fallback.")
        
        # Fallback: simple heuristic (~4 characters per token)
        char_count = len(content_str)
        token_count = max(1, char_count // 4)
        
        # Add tokens for tool calls
        if self.tool_calls:
            try:
                tool_calls_str = json.dumps(self.tool_calls)
                token_count += max(1, len(tool_calls_str) // 4)
            except:
                pass
        
        # Add message overhead
        token_count += 4
        
        # Minimum 1 token
        return max(1, token_count)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert message to dictionary format for LLM API.
        
        Returns standard format compatible with OpenAI-style APIs.
        
        Returns:
            Dictionary with role and content (and tool_calls if present)
        """
        # Map internal "agent" role to OpenAI-compatible "assistant" role
        role = "assistant" if self.role == "agent" else self.role
        
        msg = {
            "role": role,
            "content": self.content
        }
        
        # Add tool calls if present
        if self.tool_calls:
            msg["tool_calls"] = self.tool_calls
        
        # Add tool_call_id if this is a tool response
        if self.tool_call_id:
            msg["tool_call_id"] = self.tool_call_id
        
        return msg
    
    def to_full_dict(self) -> Dict[str, Any]:
        """
        Convert message to full dictionary with all fields.
        
        Includes metadata, timestamps, and IDs for persistence.
        
        Returns:
            Complete dictionary representation
        """
        return {
            "message_id": self.message_id,
            "role": self.role,
            "content": self.content,
            "tool_calls": self.tool_calls,
            "tool_call_id": self.tool_call_id,
            "metadata": self.metadata,
            "timestamp": self.timestamp.isoformat(),
            "token_count": self.token_count
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Message':
        """
        Create a Message from a dictionary.
        
        Args:
            data: Dictionary containing message data
            
        Returns:
            Message instance
        """
        msg = cls(
            role=data["role"],
            content=data["content"],
            tool_calls=data.get("tool_calls"),
            tool_call_id=data.get("tool_call_id"),
            metadata=data.get("metadata"),
            message_id=data.get("message_id")
        )
        
        # Restore timestamp if provided
        if "timestamp" in data:
            try:
                msg.timestamp = datetime.fromisoformat(data["timestamp"])
            except (ValueError, TypeError):
                pass  # Keep auto-generated timestamp

        if "token_count" in data:
            try:
                msg.token_count = int(data["token_count"])
            except (ValueError, TypeError):
                msg.token_count = msg._estimate_tokens()
        
        return msg
    
    def is_system(self) -> bool:
        """Check if this is a system message."""
        return self.role == Role.SYSTEM.value
    
    def is_user(self) -> bool:
        """Check if this is a user message."""
        return self.role == Role.USER.value
    
    def is_agent(self) -> bool:
        """Check if this is an agent message."""
        return self.role == Role.AGENT.value
    
    def is_tool(self) -> bool:
        """Check if this is a tool message."""
        return self.role == Role.TOOL.value
    
    def has_tool_calls(self) -> bool:
        """Check if message contains tool calls."""
        return len(self.tool_calls) > 0
    
    def analyze_tokens(self) -> Dict[str, Any]:
        """
        Analyze token usage for this message using TokenAnalyzer.
        
        Returns:
            Dictionary with detailed token analysis
        """
        if not HAS_TIKTOKEN:
            return {
                'role': self.role,
                'total_tokens': self.token_count,
                'breakdown': 'Tiktoken not available - using fallback estimation',
            }
        
        try:
            analyzer = get_token_analyzer()
            return analyzer.analyze_message(
                role=self.role,
                content=self.content,
                tool_calls=self.tool_calls if self.tool_calls else None
            )
        except Exception as e:
            logger.warning(f"Token analysis failed: {e}")
            return {
                'role': self.role,
                'total_tokens': self.token_count,
                'error': str(e),
            }
    
    def add_metadata(self, key: str, value: Any) -> None:
        """
        Add metadata to the message.
        
        Args:
            key: Metadata key
            value: Metadata value
        """
        self.metadata[key] = value
    
    def get_metadata(self, key: str, default: Any = None) -> Any:
        """
        Get metadata value.
        
        Args:
            key: Metadata key
            default: Default value if key not found
            
        Returns:
            Metadata value or default
        """
        return self.metadata.get(key, default)
    
    def __repr__(self) -> str:
        """String representation of message."""
        role_display = self.role.upper()
        content_preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
        tools = f", tools={len(self.tool_calls)}" if self.tool_calls else ""
        return f"Message({role_display}: {content_preview}, tokens={self.token_count}{tools})"
    
    def __str__(self) -> str:
        """User-friendly string representation."""
        return f"[{self.role}] {self.content}"
    
    def __len__(self) -> int:
        """Return token count when len() is called."""
        return self.token_count
    
    def __eq__(self, other: object) -> bool:
        """Check equality based on message_id."""
        if not isinstance(other, Message):
            return False
        return self.message_id == other.message_id


# Convenience functions for creating messages

def system_message(content: str, metadata: Optional[Dict[str, Any]] = None) -> Message:
    """
    Create a system message.
    
    Args:
        content: System message content
        metadata: Optional metadata
        
    Returns:
        System Message instance
    """
    return Message(Role.SYSTEM.value, content, metadata=metadata)


def user_message(content: str, metadata: Optional[Dict[str, Any]] = None) -> Message:
    """
    Create a user message.
    
    Args:
        content: User message content
        metadata: Optional metadata
        
    Returns:
        User Message instance
    """
    return Message(Role.USER.value, content, metadata=metadata)


def agent_message(
    content: str,
    tool_calls: Optional[List[Dict[str, Any]]] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Message:
    """
    Create an agent message.
    
    Args:
        content: Agent message content
        tool_calls: Optional tool calls
        metadata: Optional metadata
        
    Returns:
        Agent Message instance
    """
    return Message(Role.AGENT.value, content, tool_calls=tool_calls, metadata=metadata)


def tool_message(
    content: str,
    tool_call_id: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Message:
    """
    Create a tool response message.
    
    Args:
        content: Tool response content
        tool_call_id: ID of the tool call this responds to
        metadata: Optional metadata
        
    Returns:
        Tool Message instance
    """
    return Message(
        Role.TOOL.value,
        content,
        tool_call_id=tool_call_id,
        metadata=metadata
    )


def estimate_tokens(text: str) -> int:
    """
    Estimate token count for arbitrary text.
    
    Args:
        text: Text to estimate
        
    Returns:
        Estimated token count
    """
    return max(1, len(text) // 4)
