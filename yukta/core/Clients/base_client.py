
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import requests
from ..Chat.llm_response import LLMResponse
from openinference.semconv.trace import OpenInferenceSpanKindValues
from ...instrumentation.decorators import trace_yukta



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
            response = requests.post(
                url,
                json=payload,
                headers=headers,
                stream=stream,
                timeout=self.config.get("timeout", 300)
            )
            response.raise_for_status()
            return response
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(
                f"Failed to connect to {self.base_url}. "
                f"Please ensure the service is running. Error: {str(e)}"
            )
        except requests.exceptions.Timeout as e:
            raise TimeoutError(
                f"Request to {self.base_url} timed out after {self.config.get('timeout', 300)}s. "
                f"The service may be overloaded. Error: {str(e)}"
            )
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code if e.response is not None else "unknown"
            raise RuntimeError(
                f"API error ({status_code}): {str(e)}. "
                f"URL: {url}"
            )

