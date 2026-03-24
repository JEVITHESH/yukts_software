"""
Token Analyzer Module
Provides token counting and analysis using tiktoken for accurate token calculation.
"""

import tiktoken
from typing import Optional, Dict, List, Any
import logging


# Configure logging
logger = logging.getLogger(__name__)


class TokenAnalyzer:
    """
    Analyzes and tracks token usage for messages, chats, and agent interactions.
    
    Uses tiktoken for accurate token counting across different encoding models.
    Supports various model families including GPT-3.5, GPT-4, Claude, etc.
    
    Attributes:
        model_name: The model name for encoding selection
        encoding: The tiktoken encoding object for the model
        token_stats: Dictionary tracking cumulative token statistics
    """
    
    # Model encoding mappings
    MODEL_ENCODING_MAP = {
        # GPT-3.5 and GPT-4 models
        'gpt-3.5-turbo': 'cl100k_base',
        'gpt-4': 'cl100k_base',
        'gpt-4-32k': 'cl100k_base',
        'gpt-4-turbo': 'cl100k_base',
        'gpt-4o': 'cl100k_base',
        'gpt-4o-mini': 'cl100k_base',
        
        # Claude models (using cl100k_base as approximation)
        'claude-3-opus': 'cl100k_base',
        'claude-3-sonnet': 'cl100k_base',
        'claude-3-haiku': 'cl100k_base',
        'claude-2.1': 'cl100k_base',
        'claude-2': 'cl100k_base',
        'claude': 'cl100k_base',
        
        # Ollama and other open source models (approximation)
        'ollama': 'cl100k_base',
        'lmstudio': 'cl100k_base',
        'vllm': 'cl100k_base',
        'sglang': 'cl100k_base',
        
        # Default fallback
        'default': 'cl100k_base'
    }
    
    def __init__(self, model_name: str = 'gpt-4', encoding_name: Optional[str] = None):
        """
        Initialize the Token Analyzer.
        
        Args:
            model_name: The model name for token estimation
            encoding_name: Optional explicit encoding name (overrides model_name mapping)
        """
        self.model_name = model_name
        self.encoding_name = encoding_name or self._get_encoding_for_model(model_name)
        
        try:
            self.encoding = tiktoken.get_encoding(self.encoding_name)
            logger.info(f"TokenAnalyzer initialized with model: {model_name}, encoding: {self.encoding_name}")
        except Exception as e:
            logger.warning(f"Failed to load encoding {self.encoding_name}: {e}. Using cl100k_base.")
            self.encoding = tiktoken.get_encoding('cl100k_base')
            self.encoding_name = 'cl100k_base'
        
        # Token statistics tracking
        self.token_stats = {
            'total_tokens': 0,
            'system_tokens': 0,
            'user_tokens': 0,
            'agent_tokens': 0,
            'tool_tokens': 0,
            'messages_counted': 0,
            'cost_estimate': 0.0,
        }
    
    @staticmethod
    def _get_encoding_for_model(model_name: str) -> str:
        """
        Get the appropriate encoding for a model.
        
        Args:
            model_name: The model name
            
        Returns:
            The encoding name to use
        """
        model_name_lower = model_name.lower()
        
        # Check for exact matches and partial matches
        for key, encoding in TokenAnalyzer.MODEL_ENCODING_MAP.items():
            if key in model_name_lower or model_name_lower in key:
                return encoding
        
        # Default to cl100k_base for most modern models
        return 'cl100k_base'
    
    def count_tokens(self, text: str) -> int:
        """
        Count tokens in a text string.
        
        Args:
            text: The text to count tokens for
            
        Returns:
            Number of tokens
        """
        if not isinstance(text, str):
            text = str(text)
        
        try:
            tokens = self.encoding.encode(text)
            return len(tokens)
        except Exception as e:
            logger.warning(f"Error counting tokens: {e}. Using fallback estimation.")
            # Fallback: estimate ~4 characters per token
            return max(1, len(text) // 4)
    
    def count_tokens_for_messages(self, messages: List[Dict[str, Any]]) -> int:
        """
        Count tokens for a list of messages in OpenAI API format.
        
        Uses the standard formula: 4 tokens per message overhead + tokens for role+content.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            
        Returns:
            Total token count
        """
        total_tokens = 0
        
        for message in messages:
            # Each message has ~4 tokens overhead for role and structure
            total_tokens += 4
            
            # Count tokens in content
            if 'content' in message:
                content = message['content']
                if isinstance(content, str):
                    total_tokens += self.count_tokens(content)
                else:
                    total_tokens += self.count_tokens(str(content))
            
            # Count tokens in tool_calls if present
            if 'tool_calls' in message and message['tool_calls']:
                import json
                tool_calls_str = json.dumps(message['tool_calls'])
                total_tokens += self.count_tokens(tool_calls_str)
        
        return total_tokens
    
    def analyze_message(self, role: str, content: str, tool_calls: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Analyze a single message for token count and metadata.
        
        Args:
            role: Message role (system, user, agent, tool)
            content: Message content
            tool_calls: Optional tool calls
            
        Returns:
            Dictionary with token analysis
        """
        content_tokens = self.count_tokens(content)
        tool_tokens = 0
        
        if tool_calls:
            import json
            tool_calls_str = json.dumps(tool_calls)
            tool_tokens = self.count_tokens(tool_calls_str)
        
        total_tokens = content_tokens + tool_tokens + 4  # 4 tokens for message overhead
        
        # Update statistics based on role
        self.token_stats['total_tokens'] += total_tokens
        self.token_stats['messages_counted'] += 1
        
        if role == 'system':
            self.token_stats['system_tokens'] += total_tokens
        elif role == 'user':
            self.token_stats['user_tokens'] += total_tokens
        elif role in ['agent', 'assistant']:
            self.token_stats['agent_tokens'] += total_tokens
        elif role == 'tool':
            self.token_stats['tool_tokens'] += total_tokens
        
        return {
            'role': role,
            'content_tokens': content_tokens,
            'tool_tokens': tool_tokens,
            'message_overhead': 4,
            'total_tokens': total_tokens,
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get current token statistics.
        
        Returns:
            Dictionary with token usage statistics
        """
        return {
            'total_tokens': self.token_stats['total_tokens'],
            'system_tokens': self.token_stats['system_tokens'],
            'user_tokens': self.token_stats['user_tokens'],
            'agent_tokens': self.token_stats['agent_tokens'],
            'tool_tokens': self.token_stats['tool_tokens'],
            'messages_counted': self.token_stats['messages_counted'],
            'average_tokens_per_message': (
                self.token_stats['total_tokens'] / max(1, self.token_stats['messages_counted'])
            ),
            'model': self.model_name,
            'encoding': self.encoding_name,
        }
    
    def reset_stats(self) -> None:
        """Reset token statistics counters."""
        for key in self.token_stats:
            if isinstance(self.token_stats[key], (int, float)):
                self.token_stats[key] = 0
        logger.info("Token statistics reset")
    
    def estimate_cost(self, input_tokens: int, output_tokens: int = 0, model: Optional[str] = None) -> Dict[str, float]:
        """
        Estimate API cost for token usage.
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Optional model name (uses self.model_name if not provided)
            
        Returns:
            Dictionary with cost estimates
        """
        model = model or self.model_name
        model_lower = model.lower()
        
        # Pricing per 1K tokens (as of 2024)
        # These are approximate and should be updated based on current pricing
        pricing = {
            'gpt-4o': {'input': 0.005, 'output': 0.015},
            'gpt-4-turbo': {'input': 0.01, 'output': 0.03},
            'gpt-4': {'input': 0.03, 'output': 0.06},
            'gpt-3.5-turbo': {'input': 0.0005, 'output': 0.0015},
            'claude-3-opus': {'input': 0.015, 'output': 0.075},
            'claude-3-sonnet': {'input': 0.003, 'output': 0.015},
            'claude-3-haiku': {'input': 0.00025, 'output': 0.00125},
            'default': {'input': 0.001, 'output': 0.002},
        }
        
        # Find matching pricing
        matched_pricing = pricing.get('default')
        for key, price in pricing.items():
            if key in model_lower or model_lower in key:
                matched_pricing = price
                break
        
        input_cost = (input_tokens / 1000) * matched_pricing['input']
        output_cost = (output_tokens / 1000) * matched_pricing['output'] if output_tokens > 0 else 0
        total_cost = input_cost + output_cost
        
        return {
            'input_cost': round(input_cost, 6),
            'output_cost': round(output_cost, 6),
            'total_cost': round(total_cost, 6),
            'currency': 'USD',
            'model': model,
        }
    
    def format_token_report(self) -> str:
        """
        Format a human-readable token usage report.
        
        Returns:
            Formatted report string
        """
        stats = self.get_stats()
        
        report = f"""
====== TOKEN USAGE REPORT ======
Model: {stats['model']} ({stats['encoding']})
Total Tokens: {stats['total_tokens']:,}
  - System: {stats['system_tokens']:,}
  - User: {stats['user_tokens']:,}
  - Agent: {stats['agent_tokens']:,}
  - Tool: {stats['tool_tokens']:,}
Messages Counted: {stats['messages_counted']}
Avg Tokens/Message: {stats['average_tokens_per_message']:.1f}
================================
        """
        return report


# Global token analyzer instance
_token_analyzer: Optional[TokenAnalyzer] = None


def get_token_analyzer(model_name: str = 'gpt-4', encoding_name: Optional[str] = None) -> TokenAnalyzer:
    """
    Get or create a global TokenAnalyzer instance.
    
    Args:
        model_name: The model name (used on first call)
        encoding_name: Optional explicit encoding name
        
    Returns:
        TokenAnalyzer instance
    """
    global _token_analyzer
    
    if _token_analyzer is None:
        _token_analyzer = TokenAnalyzer(model_name=model_name, encoding_name=encoding_name)
    
    return _token_analyzer


def count_tokens(text: str, model_name: str = 'gpt-4') -> int:
    """
    Quick utility function to count tokens in text.
    
    Args:
        text: Text to count tokens for
        model_name: Model name for encoding
        
    Returns:
        Token count
    """
    analyzer = get_token_analyzer(model_name)
    return analyzer.count_tokens(text)


def count_message_tokens(messages: List[Dict[str, Any]], model_name: str = 'gpt-4') -> int:
    """
    Quick utility function to count tokens in a message list.
    
    Args:
        messages: Messages to count tokens for
        model_name: Model name for encoding
        
    Returns:
        Total token count
    """
    analyzer = get_token_analyzer(model_name)
    return analyzer.count_tokens_for_messages(messages)
