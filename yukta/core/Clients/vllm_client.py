from typing import List, Dict, Any, Optional
import logging
import requests
from ..Chat.llm_response import LLMResponse
from openinference.semconv.trace import OpenInferenceSpanKindValues
from ...instrumentation.decorators import trace_yukta
from .base_client import BaseLLMClient

# Configure logging
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.DEBUG)


class VLLMClient(BaseLLMClient):
    """
    Client for vLLM OpenAI-compatible API.
    vLLM provides high-throughput serving for LLMs.
    """
    
    def __init__(
        self,
        model_name: str,
        base_url: str = "http://localhost:8000",
        **kwargs
    ):
        """
        Initialize vLLM client.
        
        Args:
            model_name: Model name (must be loaded in vLLM server)
            base_url: vLLM server URL (defaults to http://localhost:8000)
            **kwargs: Additional configuration
        """
        # Use default URL if empty string is provided
        if not base_url or base_url.strip() == "":
            base_url = "http://localhost:8000"
        super().__init__(model_name, base_url, **kwargs)
        self._model_info_cache: Optional[Dict[str, Any]] = None
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Fetch model information from vLLM server.
        
        Includes context length, max tokens, and other model capabilities.
        Results are cached for efficiency.
        
        Returns:
            Dictionary with model info including 'max_model_len'
        """
        if self._model_info_cache:
            return self._model_info_cache
        
        try:
            url = f"{self.base_url}/v1/models"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if "data" not in data or not data["data"]:
                logger.warning(f"No models found in vLLM response")
                return {}
            
            # Find the current model in the list
            for model in data["data"]:
                if model.get("id") == self.model_name:
                    self._model_info_cache = model
                    logger.debug(f"Model info fetched: {self.model_name}")
                    logger.debug(f"Model max_model_len: {model.get('max_model_len', 'unknown')}")
                    return model
            
            # If model not found, return first model (fallback)
            logger.warning(f"Model {self.model_name} not found in vLLM, using first available model info")
            self._model_info_cache = data["data"][0]
            return self._model_info_cache
            
        except Exception as e:
            logger.error(f"Failed to fetch model info from vLLM: {str(e)}")
            return {}
    
    def get_context_window(self) -> int:
        """
        Get the model's context window size.
        
        Returns:
            Context window size in tokens. Defaults to 8192 if unavailable.
        """
        model_info = self.get_model_info()
        print("*" * 50)
        print(f"Model info: {model_info}")
        print("*" * 50)
        context_size = model_info.get("max_model_len", 8192)
        logger.info(f"Using context window: {context_size} tokens")
        return context_size
    
    def generate(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate response using vLLM.
        
        Args:
            messages: List of message dictionaries
            tools: Optional tools for function calling
            **kwargs: Additional arguments for the API call
            
        Returns:
            LLMResponse object
        """
    
        payload = {
            "model": self.model_name,
            "messages": messages,
            **kwargs
        }
        
        if self.max_tokens:
            payload["max_tokens"] = self.max_tokens
        
        # Add tools if provided
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"
        
        # Debug: Log the payload
        logger.debug(f"vLLM Request Payload: {payload}")
        logger.debug(f"Number of messages: {len(messages)}, Tools: {len(tools) if tools else 0}")
        
        try:
            response = self._make_request("/v1/chat/completions", payload, stream=kwargs.get("stream", False))
            data = response.json()
            
            # Debug: Log the response
            logger.debug(f"vLLM Response Status: {response.status_code}")
            logger.debug(f"vLLM Response Keys: {data.keys() if isinstance(data, dict) else type(data)}")
            
            # Validate response data
            if not isinstance(data, dict) or data is None:
                logger.error(f"Invalid response format: expected dict, got {type(data).__name__}")
                raise ValueError(f"Invalid response format: expected dict, got {type(data).__name__}")
            
            if "choices" not in data or not data["choices"]:
                logger.error(f"Response missing 'choices' or empty: {data}")
                raise ValueError("Response missing 'choices' field or empty choices list")
            
            # Parse OpenAI-compatible response
            choice = data["choices"][0]
            message = choice.get("message", {})
            
            if not isinstance(message, dict):
                logger.error(f"Invalid message format: expected dict, got {type(message).__name__}")
                raise ValueError(f"Invalid message format: expected dict, got {type(message).__name__}")
            
            content = message.get("content", "") or ""
            tool_calls = []
            
            # Parse tool calls if present
            if "tool_calls" in message and message["tool_calls"]:
                for tc in message["tool_calls"]:
                    tool_calls.append({
                        "id": tc.get("id", ""),
                        "type": tc.get("type", "function"),
                        "function": {
                            "name": tc["function"]["name"],
                            "arguments": tc["function"]["arguments"]
                        }
                    })
            
            logger.debug(f"Parsed {len(tool_calls)} tool calls from response")
            
            usage = data.get("usage", {}) or {}
            return LLMResponse(
                content=content,
                tool_calls=tool_calls,
                finish_reason=choice.get("finish_reason", "stop"),
                usage=usage,
                raw_response=data,
                cached_tokens=usage.get("cached_tokens", 0) if isinstance(usage, dict) else 0
            )
        
        except Exception as e:
            logger.error(f"vLLM API error details: {str(e)}", exc_info=True)
            raise RuntimeError(f"vLLM API error: {str(e)}")

