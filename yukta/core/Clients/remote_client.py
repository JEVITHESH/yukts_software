from typing import List, Dict, Any, Optional
from ..Chat.llm_response import LLMResponse
from openinference.semconv.trace import OpenInferenceSpanKindValues
from ...instrumentation.decorators import trace_yukta
from .base_client import BaseLLMClient
class RemoteEndpointClient(BaseLLMClient):
    """
    Generic client for remote OpenAI-compatible endpoints.
    Works with OpenAI API, Azure OpenAI, and other compatible services.
    """
    
    def __init__(
        self,
        model_name: str,
        base_url: str,
        api_key: Optional[str] = None,
        **kwargs
    ):
        """
        Initialize remote endpoint client.
        
        Args:
            model_name: Model name
            base_url: API base URL
            api_key: API key for authentication
            **kwargs: Additional configuration
        """
        if api_key:
            kwargs["api_key"] = api_key
        super().__init__(model_name, base_url, **kwargs)
    def generate(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate response using remote endpoint.
        
        Args:
            messages: List of message dictionaries
            tools: Optional tools for function calling
            stream: Whether to stream response
            
        Returns:
            LLMResponse object
        """

        formatted_messages = []
        for msg in messages:
            formatted_msg = msg.copy()
            
            # Translate 'agent' to 'assistant' for OpenAI compatibility
            if formatted_msg.get("role") == "agent":
                formatted_msg["role"] = "assistant"
                
            if formatted_msg.get("role") == "assistant" and formatted_msg.get("tool_calls") and not formatted_msg.get("content"):
                formatted_msg["content"] = None
                
            formatted_messages.append(formatted_msg)
        
        payload = {
            "model": self.model_name,
            "messages": formatted_messages,
            **kwargs
        }
        
        if self.max_tokens:
            payload["max_tokens"] = self.max_tokens
        
        # Add tools if provided
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"
        
        try:
            # Determine endpoint
            endpoint = self.config.get("endpoint", "/v1/chat/completions")
            response = self._make_request(endpoint, payload, stream=stream)
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
            return LLMResponse(
                content=content,
                tool_calls=tool_calls,
                finish_reason=choice.get("finish_reason", "stop"),
                usage=usage,
                raw_response=data,
                cached_tokens=usage.get("cached_tokens", 0) if isinstance(usage, dict) else 0
            )
        
        except Exception as e:
            raise RuntimeError(f"Remote endpoint API error: {str(e)}")
 