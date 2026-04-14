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
    def _parse_parameters(self, param_str: str) -> Dict[str, Any]:
        params = {}

        for line in param_str.splitlines():
            parts = line.strip().split()
            if len(parts) == 2:
                key, value = parts
                try:
                    if "." in value:
                        value = float(value)
                    else:
                        value = int(value)
                except ValueError:
                    pass
                params[key] = value

        return params

    def _fetch_model_data(self, model: str):
        res = requests.post(
            f"{self.BASE_URL}/api/show",
            json={"name": model}
        )
        res.raise_for_status()

        self._data = res.json()
        self._params = self._parse_parameters(
            self._data.get("parameters", "")
        )

    def get_context_window(self) -> Optional[int]:
        # Priority 1: num_ctx
        if "num_ctx" in self._params:
            return self._params["num_ctx"]

        # Priority 2: model_info fallback
        model_info = self._data.get("model_info", {})
        for k, v in model_info.items():
            if "context_length" in k:
                return v

        return None

    def get_max_context(self) -> Optional[int]:
        model_info = self._data.get("model_info", {})
        for k, v in model_info.items():
            if "context_length" in k:
                return v
        return None

    def get_model_info(self, model: str) -> Dict[str, Any]:
        # fetch + store internally
        self._fetch_model_data(model)

        context_window = self.get_context_window()
        max_context = self.get_max_context()

        caps = self._data.get("capabilities", [])

        return {
            "model": model,
            "context_window": context_window,      # ✅ uses self
            "max_context_window": max_context,
            "default_params": self._params,
            "supports_stream": True,
            "supports_tools": "tools" in caps,
            "supports_reasoning": "thinking" in caps,
            "provider": "ollama"
        }
    def generate(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate response using Ollama.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
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
            payload["options"]["num_predict"] = self.max_tokens
        
        # Add tools if provided (Ollama supports function calling in newer versions)
        if tools:
            payload["tools"] = tools
        
        try:
            response = self._make_request("/api/chat", payload, stream=kwargs.get("stream", False))
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
