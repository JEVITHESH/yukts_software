from typing import List, Dict, Any, Optional
import requests
from ..Chat.llm_response import LLMResponse
from openinference.semconv.trace import OpenInferenceSpanKindValues
from ...instrumentation.decorators import trace_yukta
from .base_client import BaseLLMClient
class OllamaClient(BaseLLMClient):
    """
    Client for Ollama API.
    Ollama runs models locally on your machine.
    """
    
    def __init__(
        self,
        model_name: str = "llama2",
        base_url: str = "http://localhost:11434",
        **kwargs
    ):
        """
        Initialize Ollama client.
        
        Args:
            model_name: Ollama model name (e.g., 'llama2', 'mistral', 'codellama')
            base_url: Ollama server URL (defaults to http://localhost:11434)
            **kwargs: Additional configuration
        """
        # Use default URL if empty string is provided
        if not base_url or base_url.strip() == "":
            base_url = "http://localhost:11434"
        super().__init__(model_name, base_url, **kwargs)
    
    def generate(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        stream: bool = False
    ) -> LLMResponse:
        """
        Generate response using Ollama.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            tools: Optional tools for function calling
            stream: Whether to stream response
            
        Returns:
            LLMResponse object
        """
        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": self.temperature,
            }
        }
        
        if self.max_tokens:
            payload["options"]["num_predict"] = self.max_tokens
        
        # Add tools if provided (Ollama supports function calling in newer versions)
        if tools:
            payload["tools"] = tools
        
        try:
            response = self._make_request("/api/chat", payload, stream=stream)
            data = response.json()
            
            # Validate response data
            if not isinstance(data, dict) or data is None:
                raise ValueError(f"Invalid response format: expected dict, got {type(data).__name__}")
            
            # Parse response
            content = ""
            tool_calls = []
            
            if "message" in data:
                message = data.get("message", {})
                if isinstance(message, dict):
                    content = message.get("content", "")
                    
                    # Check for tool calls
                    if "tool_calls" in message:
                        tool_calls = message["tool_calls"]
            
            return LLMResponse(
                content=content,
                tool_calls=tool_calls,
                finish_reason=data.get("done_reason", "stop"),
                usage={
                    "prompt_tokens": data.get("prompt_eval_count", 0),
                    "completion_tokens": data.get("eval_count", 0),
                    "total_tokens": data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
                    # Ollama doesn't directly expose cache info, but we can track it
                    "cached_tokens": 0  # Would need Ollama API enhancement
                },
                raw_response=data,
                cached_tokens=0
            )
        
        except (ConnectionError, TimeoutError) as e:
            raise RuntimeError(f"Ollama connection error: {str(e)}")
        except Exception as e:
            raise RuntimeError(f"Ollama API error: {str(e)}")
    
    def list_models(self) -> List[str]:
        """
        List available Ollama models.
        
        Returns:
            List of model names
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            response.raise_for_status()
            data = response.json()
            return [model["name"] for model in data.get("models", [])]
        except Exception as e:
            raise RuntimeError(f"Error listing Ollama models: {str(e)}")
