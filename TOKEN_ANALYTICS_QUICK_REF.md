# Token Analysis Quick Reference

## Installation
```bash
pip install tiktoken>=0.5.0
```

## Quick Start

### Count Tokens Anywhere
```python
from yukta.core.token_analyzer import count_tokens

tokens = count_tokens("Your text here")
print(f"Tokens: {tokens}")
```

### Message Token Analysis
```python
from yukta.core.Chat.message import user_message

msg = user_message("Hello!")
print(f"Tokens: {msg.token_count}")
print(f"Analysis: {msg.analyze_tokens()}")
```

### Chat Token Tracking
```python
from yukta.core.Chat.chat import Chat

chat = Chat(system_prompt="You are helpful", model_name='gpt-4')
chat.add_user_message("Tell me about Python")
chat.add_agent_message("Python is...")

# Get analysis and report
print(chat.get_token_analysis())
print(chat.get_token_report())
```

### Agent Token Analysis
```python
from yukta.core.Agent.agent import Agent

agent = Agent(...)  # Token analyzer auto-initialized

# After running agent...
print(agent.get_token_report())
print(agent.get_token_summary())
print(agent.estimate_token_costs())
```

## Key Methods by Component

### Message
- `token_count` - Property with token count
- `analyze_tokens()` - Detailed token breakdown

### Chat
- `get_token_analysis()` - Dict with all token metrics
- `get_token_report()` - Formatted human-readable report
- `get_token_count()` - Quick total token count
- `stats` - Dict with message-level breakdowns

### Agent
- `get_token_analysis()` - Comprehensive token analysis
- `get_token_report()` - Formatted report
- `get_token_summary()` - One-line summary
- `estimate_token_costs()` - Cost estimation
- `update_token_stats(input, output, system)` - Manual update
- `stats` - Dict with all metrics

### TokenAnalyzer (Direct Use)
```python
from yukta.core.token_analyzer import get_token_analyzer

analyzer = get_token_analyzer('gpt-4')
analyzer.count_tokens("text")                    # int
analyzer.count_tokens_for_messages([{...}])      # int
analyzer.analyze_message("user", "hello")        # dict
analyzer.get_stats()                             # dict
analyzer.estimate_cost(1000, 500)                # dict
analyzer.format_token_report()                   # str
```

## Statistics Available

### Per Message
- `token_count` - Total tokens

### Per Chat
- `total_messages` - Message count
- `user_messages` / `user_tokens`
- `agent_messages` / `agent_tokens`
- `tool_calls` / `tool_tokens`
- `system_tokens`
- `total_tokens`
- `context_window` and `context_usage_percent`

### Per Agent
- `input_tokens` / `output_tokens` / `system_tokens`
- `total_tokens`
- `llm_calls`
- `token_cost_estimate`
- `tool_calls` (with success rate)

## Cost Estimation

```python
# For agent
costs = agent.estimate_token_costs()
print(f"Input: ${costs['input_cost']:.6f}")
print(f"Output: ${costs['output_cost']:.6f}")
print(f"Total: ${costs['total_cost']:.6f}")
```

## Context Window Management

```python
chat = Chat(
    context_window=8192,    # Total tokens
    context_buffer=512      # Reserved for output
)

# Check usage
usage = chat.get_token_analysis()
print(f"{usage['context_usage_percent']}% used")
print(f"{usage['available_tokens']} tokens available")

# Messages auto-trim when exceeded
```

## Supported Models

```python
# Auto-detected encoding
analyzer = TokenAnalyzer(model_name='gpt-4')
analyzer = TokenAnalyzer(model_name='gpt-3.5-turbo')
analyzer = TokenAnalyzer(model_name='claude-3-opus')
analyzer = TokenAnalyzer(model_name='ollama')

# Custom encoding
analyzer = TokenAnalyzer(encoding_name='cl100k_base')
```

## Debugging

```python
# Enable debug logging
import logging
logging.getLogger('yukta.core.token_analyzer').setLevel(logging.DEBUG)

# Check if tiktoken available
from yukta.core.Chat.message import HAS_TIKTOKEN
print(f"Tiktoken available: {HAS_TIKTOKEN}")

# Check agent token analyzer status
print(agent.token_analyzer)  # None if not initialized
```

## Common Patterns

### Track Conversation Growth
```python
initial = chat.get_token_count()
chat.add_user_message("...")
chat.add_agent_message("...")
final = chat.get_token_count()
print(f"Added {final - initial} tokens")
```

### Monitor Context Health
```python
analysis = chat.get_token_analysis()
if analysis['context_usage_percent'] > 80:
    print("Warning: High context usage")
elif analysis['available_tokens'] < 500:
    print("Warning: Low available tokens")
```

### Export Token Report
```python
with open('token_report.txt', 'w') as f:
    f.write(agent.get_token_report())
```

### Daily Cost Tracking
```python
costs = agent.estimate_token_costs()
with open('daily_costs.csv', 'a') as f:
    f.write(f"{datetime.now()},{costs['total_cost']}\n")
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Tiktoken not available" | `pip install tiktoken>=0.5.0` |
| Wrong token counts | Check `model_name` parameter |
| Cost estimates wrong | Update pricing in `TokenAnalyzer` |
| High memory usage | Token analyzer is lightweight, likely elsewhere |
| Slow token counting | Use `count_tokens()` only when needed |

## Performance Tips

1. **Reuse analyzer**: Use `get_token_analyzer()` for global instance
2. **Batch operations**: Count multiple messages at once
3. **Cache results**: Store `token_count` in messages (already done)
4. **Lazy analysis**: Only call `get_token_report()` when needed

## Reset/Clear

```python
# Clear chat messages
chat.clear_messages(keep_system=True)

# Reset agent stats
agent.reset()

# Reset analyzer stats
agent.token_analyzer.reset_stats()
```

## Integration Points

- **Agent Creation**: Automatically initializes with LLM client model
- **Message Creation**: Tokens counted on creation
- **Chat Operations**: Tracked for each add_message() call
- **Context Management**: Auto-trims when exceeding window
- **Cost Estimation**: Available after each operation
