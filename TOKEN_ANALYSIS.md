# Token Analysis and Tracking in Yukta

## Overview

The Yukta package now integrates **tiktoken** for accurate token counting and comprehensive token usage analysis across agent creation, message tracking, chat management, and LLM interactions.

## Features

### 1. **Accurate Token Counting using TikToken**
   - Real token counting based on OpenAI's `tiktoken` library
   - Support for multiple encoding models (GPT-4, GPT-3.5, Claude, etc.)
   - Fallback to character-based estimation if tiktoken is unavailable

### 2. **Token Tracking at Multiple Levels**
   - **Message Level**: Each message tracks its token count
   - **Chat Level**: Conversation tracks system, user, agent, and tool tokens separately
   - **Agent Level**: Comprehensive tracking of input, output, and system tokens

### 3. **Detailed Token Analysis**
   - Token cost estimation based on current pricing
   - Context window usage monitoring
   - Message trimming tracking
   - Token distribution analysis (Input vs Output vs System)

## Installation

```bash
pip install tiktoken>=0.5.0
```

Or install all dependencies from requirements.txt:

```bash
pip install -r requirements.txt
```

## Usage

### Basic Token Counting

```python
from yukta.core.token_analyzer import count_tokens, count_message_tokens

# Count tokens in a text
text = "This is a sample text"
token_count = count_tokens(text)
print(f"Tokens: {token_count}")

# Count tokens in a message list
messages = [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Hello, how are you?"}
]
total_tokens = count_message_tokens(messages)
print(f"Total tokens: {total_tokens}")
```

### Message Token Analysis

```python
from yukta.core.Chat.message import user_message

# Create a message
msg = user_message("What is the weather today?")

# Get token count
print(f"Message tokens: {msg.token_count}")

# Analyze tokens in detail
analysis = msg.analyze_tokens()
print(analysis)
# Output: {
#   'role': 'user',
#   'content_tokens': 6,
#   'tool_tokens': 0,
#   'message_overhead': 4,
#   'total_tokens': 10
# }
```

### Chat Token Analysis

```python
from yukta.core.Chat.chat import Chat

# Create a chat with token tracking
chat = Chat(
    system_prompt="You are a helpful assistant",
    model_name='gpt-4'  # Specify the model for accurate token counting
)

# Add messages
chat.add_user_message("Tell me about Python")
chat.add_agent_message("Python is a popular programming language...")

# Get token analysis
analysis = chat.get_token_analysis()
print(analysis)
# Output: {
#   'available': True,
#   'model': 'gpt-4',
#   'encoding': 'cl100k_base',
#   'total_tokens': 156,
#   'context_window': 8192,
#   'context_usage_percent': 1.9,
#   'available_tokens': 8036,
#   ...
# }

# Get formatted report
print(chat.get_token_report())
```

### Agent Token Analysis

```python
from yukta.core.Agent.agent import Agent

# Create an agent
agent = Agent(
    agent_name="FinanceAdvisor",
    system_prompt=system_prompt,
    tools_processor=tools_processor,
    llm_client=llm_client  # Token analyzer auto-initialized
)

# Run agent interactions...
# Token stats are tracked automatically

# Get token analysis
analysis = agent.get_token_analysis()
print(analysis)
# Output: {
#   'available': True,
#   'agent_id': '...',
#   'agent_name': 'FinanceAdvisor',
#   'model': 'gpt-4',
#   'total_tokens': 2500,
#   'input_tokens': 1800,
#   'output_tokens': 700,
#   'llm_calls': 5,
#   'token_cost_estimate': 0.025,
#   'token_distribution': {
#     'input': 72.0,
#     'output': 28.0,
#     'system': 0.0
#   }
# }

# Get formatted report
print(agent.get_token_report())

# Get token summary
print(agent.get_token_summary())
# Output: Agent 'FinanceAdvisor' - Total Tokens: 2,500 (Input: 1,800, Output: 700, System: 0) - Cost: $0.025000

# Estimate token costs
costs = agent.estimate_token_costs()
print(costs)
# Output: {
#   'input_cost': 0.018,
#   'output_cost': 0.021,
#   'total_cost': 0.039,
#   'currency': 'USD'
# }
```

## Token Analyzer Module

The `TokenAnalyzer` class provides comprehensive token analysis functionality:

```python
from yukta.core.token_analyzer import TokenAnalyzer, get_token_analyzer

# Create a token analyzer for a specific model
analyzer = TokenAnalyzer(model_name='gpt-4o')

# Count tokens in text
text = "Your text here"
tokens = analyzer.count_tokens(text)

# Analyze a single message
analysis = analyzer.analyze_message(
    role='user',
    content='Hello, how are you?',
    tool_calls=None
)

# Count tokens in a message list
messages = [...]
total = analyzer.count_tokens_for_messages(messages)

# Get statistics
stats = analyzer.get_stats()
print(stats)
# Output: {
#   'total_tokens': 5000,
#   'system_tokens': 100,
#   'user_tokens': 2000,
#   'agent_tokens': 2400,
#   'tool_tokens': 500,
#   'messages_counted': 50,
#   'average_tokens_per_message': 100.0,
#   'model': 'gpt-4',
#   'encoding': 'cl100k_base'
# }

# Estimate costs
cost = analyzer.estimate_cost(input_tokens=1000, output_tokens=500)
print(cost)
# Output: {
#   'input_cost': 0.01,
#   'output_cost': 0.015,
#   'total_cost': 0.025,
#   'currency': 'USD'
# }

# Generate a formatted report
report = analyzer.format_token_report()
print(report)
```

## Context Window Management

The Chat class automatically manages context windows:

```python
chat = Chat(
    system_prompt="...",
    context_window=8192,    # Total tokens available
    context_buffer=512      # Reserve for output tokens
)

# Check context usage
analysis = chat.get_token_analysis()
print(f"Context usage: {analysis['context_usage_percent']}%")
print(f"Available tokens: {analysis['available_tokens']}")

# Messages are automatically trimmed when context exceeds limit
# (oldest messages are removed first, keeping system prompt and recent messages)
```

## Supported Models

The TokenAnalyzer automatically handles encoding for these models:

- **OpenAI**: gpt-4, gpt-4-32k, gpt-4-turbo, gpt-4o, gpt-3.5-turbo
- **Anthropic**: claude-3, claude-2, claude
- **Open Source**: ollama, lmstudio, vllm, sglang

For other models, `cl100k_base` encoding is used as a reasonable approximation.

## API Pricing

Token costs are estimated based on current pricing (as of 2024):

| Model | Input (per 1K) | Output (per 1K) |
|-------|----------------|-----------------|
| gpt-4o | $0.005 | $0.015 |
| gpt-4-turbo | $0.01 | $0.03 |
| gpt-4 | $0.03 | $0.06 |
| gpt-3.5-turbo | $0.0005 | $0.0015 |
| claude-3-opus | $0.015 | $0.075 |
| claude-3-sonnet | $0.003 | $0.015 |
| claude-3-haiku | $0.00025 | $0.00125 |

**Note**: These prices are approximate and should be updated based on current provider pricing.

## Statistics Tracked

Each component tracks different token metrics:

### Message Level
- `token_count`: Total tokens in the message
- `content_tokens`: Tokens in message content
- `tool_tokens`: Tokens in tool calls (if any)
- `message_overhead`: Tokens for message structure (4 tokens)

### Chat Level
- `total_tokens`: Total tokens including system prompt
- `system_tokens`: Tokens in system prompt
- `user_tokens`: Accumulated user message tokens
- `agent_tokens`: Accumulated agent response tokens
- `tool_tokens`: Accumulated tool response tokens
- `messages_trimmed`: Number of messages removed by context window management

### Agent Level
- `total_tokens`: Accumulated across all interactions
- `input_tokens`: LLM input tokens
- `output_tokens`: LLM output tokens
- `system_tokens`: System prompt tokens
- `llm_calls`: Number of LLM API calls
- `token_cost_estimate`: Estimated cost in USD

## Logging

Token analysis events are logged at various levels:

```python
import logging

# Enable debug logging to see token counting details
logging.getLogger('yukta.core.token_analyzer').setLevel(logging.DEBUG)
logging.getLogger('yukta.core.Chat.chat').setLevel(logging.DEBUG)
logging.getLogger('yukta.core.Agent.agent').setLevel(logging.DEBUG)
```

## Performance Considerations

1. **Accurate Counting is Slightly Slower**: tiktoken provides accurate counts but is slightly slower than character-based estimation
2. **Fallback Available**: If tiktoken fails to load, the system automatically falls back to character-based estimation
3. **Caching**: The TokenAnalyzer reuses the same encoding instance for efficiency
4. **Global Instance**: Use `get_token_analyzer()` for the global instance to avoid multiple initializations

## Troubleshooting

### Tiktoken Not Available
If you see "Tiktoken not available" in token analysis:
```bash
pip install tiktoken>=0.5.0
```

### Wrong Model Encoding
Ensure the model name is set correctly:
```python
chat = Chat(model_name='gpt-4')  # Correct
# or
analyzer = TokenAnalyzer(model_name='gpt-4')
```

### Cost Estimates Seem Wrong
Check the pricing in the `estimate_cost` method. API pricing changes frequently and may need updates.

## Best Practices

1. **Initialize with Correct Model Name**
   ```python
   agent = Agent(..., llm_client=llm_client)  # Uses llm_client.model_name
   ```

2. **Monitor Context Usage**
   ```python
   if chat.get_token_analysis()['context_usage_percent'] > 80:
       logger.warning("High context usage detected")
   ```

3. **Track Costs Over Time**
   ```python
   daily_costs = agent.estimate_token_costs()
   # Log this for billing purposes
   ```

4. **Use Token Reports for Debugging**
   ```python
   print(agent.get_token_report())
   # Helps identify where tokens are being spent
   ```

## Example: Complete Integration

```python
from yukta.core.Agent.agent import Agent
from yukta.core.Chat.chat import Chat
from yukta.config.system_prompt import SystemPrompt
from yukta.tools.tools_pro import ToolProcessor
from yukta.core.Clients.llmclientfactory import create_llm_client

# 1. Create LLM client
llm_client = create_llm_client('gpt-4o')

# 2. Create system prompt
system_prompt = SystemPrompt(
    prompt_text="You are a helpful assistant",
    prompt_name="helpful_assistant"
)

# 3. Create tools
tools_processor = ToolProcessor()

# 4. Create agent (token analyzer auto-initialized)
agent = Agent(
    agent_name="MyAgent",
    system_prompt=system_prompt,
    tools_processor=tools_processor,
    llm_client=llm_client
)

# 5. Chat is auto-initialized with token tracking
# Use agent normally...

# 6. Get token analysis anytime
print(agent.get_token_report())
print(f"Cost estimate: {agent.estimate_token_costs()}")

# 7. Reset token stats when needed
agent.reset()
```

## Summary

Tiktoken integration provides:
- ✅ Accurate token counting for all messages
- ✅ Automatic token tracking at every level
- ✅ Context window management with automatic trimming
- ✅ Cost estimation based on real API pricing
- ✅ Comprehensive reporting and analytics
- ✅ Graceful fallback when tiktoken unavailable
- ✅ Support for multiple model families
- ✅ Detailed statistics and insights
