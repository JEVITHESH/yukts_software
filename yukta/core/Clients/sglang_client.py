from typing import List, Dict, Any, Optional
from ..Chat.llm_response import LLMResponse
from openinference.semconv.trace import OpenInferenceSpanKindValues
from ...instrumentation.decorators import trace_yukta
from .base_client import BaseLLMClient
class SGLangClient(BaseLLMClient):
    """
    Client for SGLang OpenAI-compatible API.
    SGLang provides fast, highly optimized serving for LLMs.
    """
    
    def __init__(
        self,
        model_name: str,
        base_url: str = "http://localhost:30000",
        **kwargs
    ):
        """
        Initialize SGLang client.
        
        Args:
            model_name: Model name (must be loaded in SGLang server)
            base_url: SGLang server URL (defaults to port 30000)
            **kwargs: Additional configuration
        """
        # Use default URL if empty string is provided
        if not base_url or base_url.strip() == "":
            base_url = "http://localhost:30000"
        super().__init__(model_name, base_url, **kwargs)
    def generate(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        stream: bool = False
    ) -> LLMResponse:
        """
        Generate response using SGLang.
        """
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": self.temperature,
            "stream": False
        }
        
        if self.max_tokens:
            payload["max_tokens"] = self.max_tokens
            
        # Add tools if provided
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"
            
        try:
            # SGLang natively supports the standard OpenAI completions endpoint
            response = self._make_request("/v1/chat/completions", payload, stream=stream)
            data = response.json()
            
            # Validate response data
            if not isinstance(data, dict) or data is None:
                raise ValueError(f"Invalid response format: expected dict, got {type(data).__name__}")
            
            if "choices" not in data or not data["choices"]:
                raise ValueError("Response missing 'choices' field or empty choices list")
            
            # Parse OpenAI-compatible response
            choice = data["choices"][0]
            message = choice.get("message", {})
            
            if not isinstance(message, dict):
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
            
            usage = data.get("usage", {}) or {}
            cached = 0
            if isinstance(usage, dict) and "prompt_tokens_details" in usage:
                details = usage.get("prompt_tokens_details", {})
                if isinstance(details, dict):
                    cached = details.get("cached_tokens", 0)
            
            return LLMResponse(
                content=content,
                tool_calls=tool_calls,
                finish_reason=choice.get("finish_reason", "stop"),
                usage=usage,
                raw_response=data,
                cached_tokens=cached
            )
            
        except Exception as e:
            raise RuntimeError(f"SGLang API error: {str(e)}")
 