from typing import List, Dict, Any, Optional
from ..Chat.llm_response import LLMResponse
from openinference.semconv.trace import OpenInferenceSpanKindValues
from ...instrumentation.decorators import trace_yukta
from .base_client import BaseLLMClient
class HuggingFaceClient(BaseLLMClient):
    """
    Client for Hugging Face Inference Endpoints and Serverless API.
    Supports models running Text Generation Inference (TGI) with Messages API.
    """
    
    def __init__(
        self,
        model_name: str,
        hf_token: str,
        base_url: Optional[str] = None,
        **kwargs
    ):
        """
        Initialize Hugging Face client.
        
        Args:
            model_name: Hugging Face model ID (e.g., 'meta-llama/Meta-Llama-3-8B-Instruct')
            hf_token: Hugging Face API token starting with 'hf_'
            base_url: Optional custom Inference Endpoint URL. If None, uses Serverless API.
            **kwargs: Additional configuration
        """
        # If no base_url is provided, intelligently route to the HF Serverless API
        if not base_url:
            base_url = "https://router.huggingface.co/hf-inference"
            
        kwargs["api_key"] = hf_token
        super().__init__(model_name, base_url, **kwargs)
    def generate(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        stream: bool = False
    ) -> LLMResponse:
        """
        Generate response using Hugging Face TGI Messages API.
        """
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": self.temperature,
            "stream": False
        }
        
        if self.max_tokens:
            payload["max_tokens"] = self.max_tokens
            
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"
            
        try:
            # Append the standard OpenAI compatible route for TGI
            response = self._make_request("/v1/chat/completions", payload, stream=stream)
            data = response.json()
            
            # Validate response data
            if not isinstance(data, dict) or data is None:
                raise ValueError(f"Invalid response format: expected dict, got {type(data).__name__}")
            
            if "choices" not in data or not data["choices"]:
                raise ValueError("Response missing 'choices' field or empty choices list")
            
            # Parse response
            choice = data["choices"][0]
            message = choice.get("message", {})
            
            if not isinstance(message, dict):
                raise ValueError(f"Invalid message format: expected dict, got {type(message).__name__}")
            
            content = message.get("content", "") or ""
            tool_calls = []
            
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
            raise RuntimeError(f"Hugging Face API error: {str(e)}")
