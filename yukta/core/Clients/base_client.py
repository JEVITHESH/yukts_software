
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import requests
import json
import logging
from ..Chat.llm_response import LLMResponse
from openinference.semconv.trace import OpenInferenceSpanKindValues
from ...instrumentation.decorators import trace_yukta

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



class BaseLLMClient(ABC):
    """
    Abstract base class for LLM clients.
    """
    
    def __init__(
        self,
        model_name: str,
        base_url: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ):
        """
        Initialize the LLM client.
        
        Args:
            model_name: Name of the model to use
            base_url: Base URL for the API
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional configuration
        """
        self.model_name = model_name
        # Validate and normalize base URL
        if not base_url or not base_url.strip():
            raise ValueError("base_url cannot be empty. Please provide a valid URL (e.g., 'http://localhost:8000')")
        self.base_url = base_url.rstrip('/')
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.config = kwargs
    
    @abstractmethod
    @trace_yukta(kind=OpenInferenceSpanKindValues.LLM)
    def generate(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        stream: bool = False
    ) -> LLMResponse:
        """
        Generate a response from the LLM.
        
        Args:
            messages: List of message dictionaries
            tools: Optional list of tools the model can use
            stream: Whether to stream the response
            
        Returns:
            LLMResponse object
        """
        pass
    @trace_yukta(kind=OpenInferenceSpanKindValues.LLM)
    def _make_request(
        self,
        endpoint: str,
        payload: Dict[str, Any],
        stream: bool = False
    ) -> requests.Response:
        """
        Make an HTTP request to the API.
        
        Args:
            endpoint: API endpoint
            payload: Request payload
            stream: Whether to stream the response
            
        Returns:
            Response object
            
        Raises:
            ConnectionError: If cannot connect to API server
            RuntimeError: If API returns error response
        """
        url = f"{self.base_url}{endpoint}"
        headers = {
            "Content-Type": "application/json"
        }
        
        # Add API key if provided
        if "api_key" in self.config:
            headers["Authorization"] = f"Bearer {self.config['api_key']}"
        
        try:
            # Clean payload to ensure all objects are JSON-serializable
            # This handles protobuf objects and other non-serializable types from MCP tools
            clean_payload = _make_json_serializable(payload)
            
            # Debug logging
            logger.debug(f"Sending request to {url}")
            logger.debug(f"Payload keys: {list(clean_payload.keys())}")
            logger.debug(f"Messages: {len(clean_payload.get('messages', []))}")
            if 'tools' in clean_payload:
                logger.debug(f"Tools: {len(clean_payload['tools'])} tools included")
            
            response = requests.post(
                url,
                json=clean_payload,
                headers=headers,
                stream=stream,
                timeout=self.config.get("timeout", 300)
            )
            response.raise_for_status()
            return response
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Connection error to {self.base_url}: {str(e)}")
            raise ConnectionError(
                f"Failed to connect to {self.base_url}. "
                f"Please ensure the service is running. Error: {str(e)}"
            )
        except requests.exceptions.Timeout as e:
            logger.error(f"Timeout error: {str(e)}")
            raise TimeoutError(
                f"Request to {self.base_url} timed out after {self.config.get('timeout', 300)}s. "
                f"The service may be overloaded. Error: {str(e)}"
            )
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code if e.response is not None else "unknown"
            error_text = e.response.text if e.response is not None else "No response body"
            logger.error(f"HTTP error {status_code}: {error_text}")
            logger.error(f"Request URL: {url}")
            logger.debug(f"Full payload sent: {json.dumps(clean_payload, indent=2, default=str)}")
            raise RuntimeError(
                f"API error ({status_code}): {str(e)}. "
                f"URL: {url}. "
                f"Response: {error_text}"
            )

