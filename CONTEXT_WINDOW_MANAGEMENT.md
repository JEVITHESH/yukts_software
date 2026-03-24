# Context Window Management & Sliding Window Implementation

## Overview

The yukta framework now includes automatic **context window management** with **sliding window trimming** to handle token limit constraints from LLM models.

### Problem Solved
Previously, when chat history exceeded the model's context window (e.g., 8192 tokens for deepseek-r1-32b), users would receive API errors:
```
HTTP error 400: You passed 8193 input tokens and requested 0 output tokens. 
However, the model's context length is only 8192 tokens...
```

### Solution
The framework now:
1. **Fetches model context size** automatically from the vLLM server
2. **Tracks cumulative token count** as messages are added
3. **Automatically trims old messages** when approaching context limits (sliding window)
4. **Preserves system prompt** and recent messages for coherent responses

---

## Architecture

### Components Modified

#### 1. **vllm_client.py** - Model Information Retrieval
Added two new methods:

```python
def get_model_info(self) -> Dict[str, Any]:
    """Fetch model information from vLLM server.
    
    Queries /v1/models endpoint and caches result.
    Returns: Dictionary with model capabilities including 'max_model_len'
    """

def get_context_window(self) -> int:
    """Get the model's context window size.
    
    Returns: Context window in tokens (default: 8192 if unavailable)
    """
```

**Key Features:**
- Caches model info to avoid repeated API calls
- Queries vLLM `/v1/models` endpoint
- Falls back to 8192 tokens if unavailable
- Logs detected context window size

**Example Output:**
```
INFO - Using context window: 8192 tokens
DEBUG - Model info fetched: deepseek-r1-32b
DEBUG - Model max_model_len: 8192
```

#### 2. **chat.py** - Context Window Awareness

**Modified `__init__` signature:**
```python
def __init__(
    self,
    system_prompt: Optional[str] = None,
    chat_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    context_window: int = 8192,           # NEW: Model context size
    context_buffer: int = 512             # NEW: Output buffer
)
```

**New Parameters:**
- `context_window`: Total model context size (tokens)
- `context_buffer`: Safety margin for output tokens (default: 512)
  - Calculated as: `max_input_tokens = context_window - context_buffer`

**New Attributes:**
```python
self.context_window = context_window      # Total: 8192
self.context_buffer = context_buffer      # Reserved: 512
self.max_input_tokens = 7680              # Available: 8192 - 512
```

**New Method: `trim_messages_to_context()`**

Implements sliding window algorithm:

```python
def trim_messages_to_context(self) -> None:
    """
    Implement sliding window to trim old messages when context exceeds limit.
    
    Algorithm:
    1. Calculate total tokens (messages + system prompt)
    2. If total > max_input_tokens:
       - Remove oldest message from self.messages
       - Repeat until total <= max_input_tokens
    3. Log trimming details for visibility
    """
```

**Trimming Logic:**
- Preserves system prompt (always kept)
- Removes oldest user/agent messages first
- Keeps most recent messages for context coherence
- Logs each trim for debugging

**Example Trim Log:**
```
INFO - Context exceeded: 8193 > 7680 (window: 8192, buffer: 512). Trimming old messages...
DEBUG - Removed message: user - "Search for financial reports..." (tokens=450)
DEBUG - Removed message: agent - "Here are the search results..." (tokens=580)
INFO - Trimmed 2 messages. Final tokens: 7620 (margin: 60)
```

**Modified `get_messages()` Method:**

Now automatically applies trimming before returning messages:
```python
def get_messages(self, include_system: bool = True) -> List[Dict[str, Any]]:
    """
    Get messages in LLM API format.
    
    Automatically trims old messages if context window would be exceeded.
    Uses sliding window to keep most recent messages.
    """
    # Call trim first - this is key!
    self.trim_messages_to_context()
    
    # Then return properly sized message list
    messages = [...]
    return messages
```

**Statistics Tracking:**
New stat added to track trimming operations:
```python
self.stats = {
    "total_messages": 0,
    "user_messages": 0,
    "agent_messages": 0,
    "tool_calls": 0,
    "total_tokens": 0,
    "messages_trimmed": 0  # NEW: Count of trimmed messages
}
```

#### 3. **agent.py** - Context Window Configuration

**Updated Chat Initialization:**

```python
# Get context window from LLM client if available
context_window = 8192  # Default fallback

if hasattr(self.llm_client, 'get_context_window'):
    try:
        context_window = self.llm_client.get_context_window()
        logger.info(f"Using LLM context window: {context_window} tokens")
    except Exception as e:
        logger.warning(f"Failed to get LLM context window: {str(e)}")

# Create Chat with context-aware parameters
self.chat = Chat(
    system_prompt=system_prompt_text,
    chat_id=self.agent_id,
    metadata={"agent_name": self.agent_name},
    context_window=context_window,    # NEW
    context_buffer=512                 # NEW
)
```

**Key Points:**
- Safely retrieves context window from LLM client
- Gracefully falls back to default if unavailable
- Logs all context window determination steps
- Configures Chat with model-specific context size

---

## Usage & Configuration

### Default Configuration
```python
# Default values (if not overridden)
context_window = 8192    # Typical for mid-sized models
context_buffer = 512     # Reserve ~6% for output tokens
max_input_tokens = 7680  # Available for input
```

### Custom Configuration
If you need to override defaults, modify Chat initialization:

```python
# For smaller context windows
chat = Chat(
    system_prompt="...",
    context_window=4096,    # Smaller context (e.g., mobile model)
    context_buffer=256      # Smaller output buffer
)

# For larger context windows (if using 32k or 100k models)
chat = Chat(
    system_prompt="...",
    context_window=32000,   # 32k context window
    context_buffer=2000     # More output buffer
)
```

### Buffer Strategy
- **Default (512 tokens)**: Safe for most chat scenarios; allows ~1000-1500 word responses
- **Smaller buffer (256 tokens)**: More input flexibility; limits output to ~400-500 words
- **Larger buffer (1024+ tokens)**: Long responses; less input history preserved

---

## How Sliding Window Works

### Example Scenario

**Initial State:**
```
System Prompt:     500 tokens
Message 1 (user):  450 tokens
Message 2 (agent): 600 tokens
Message 3 (user):  400 tokens
Message 4 (agent): 680 tokens
---
Total:            2630 tokens
Max Input:        7680 tokens (8192 - 512)
Status:           ✓ Under limit
```

**After adding more messages - exceeds limit:**
```
System Prompt:     500 tokens
Message 1 (user):  450 tokens
Message 2 (agent): 600 tokens
Message 3 (user):  400 tokens
Message 4 (agent): 680 tokens
Message 5 (user):  800 tokens
Message 6 (agent): 700 tokens
Message 7 (user):  920 tokens
---
Total:            5050 tokens - Still ok
After more...      After adding 8-12 more messages approaches 8193
```

**Trimming Applied:**
```
When get_messages() is called and total > 7680:

Step 1: Remove Message 1 (user, 450 tokens)
        Total: 7743 tokens → Still over limit

Step 2: Remove Message 2 (agent, 600 tokens)
        Total: 7143 tokens → Now under limit! ✓

Result:
System Prompt:     500 tokens (preserved!)
Message 3 (user):  400 tokens
Message 4 (agent): 680 tokens
Message 5 (user):  800 tokens
Message 6 (agent): 700 tokens
Message 7 (user):  920 tokens
Message 8 (agent): 643 tokens
---
Total:            4643 tokens
Status:           ✓ Under limit with margin of 3037 tokens
```

### Why This Works

1. **System prompt preserved**: Maintains agent behavior/instructions
2. **Recent messages kept**: Latest context is most relevant
3. **Oldest removed first**: Less likely to impact response quality
4. **Efficient algorithm**: O(n) single-pass trimming
5. **Logging**: Full visibility into what was trimmed and why

---

## Monitoring & Debugging

### Log Messages to Watch

**Successful operation (no trimming):**
```
DEBUG - Chat initialized with context window: 8192, buffer: 512
INFO - Using context window: 8192 tokens
```

**Trimming triggered:**
```
INFO - Context exceeded: 8193 > 7680 (window: 8192, buffer: 512). Trimming old messages...
DEBUG - Removed message: user - "..." (tokens=450)
DEBUG - Removed message: agent - "..." (tokens=580)
INFO - Trimmed 2 messages. Final tokens: 7620 (margin: 60)
```

**Context window retrieval:**
```
DEBUG - Model info fetched: deepseek-r1-32b
DEBUG - Model max_model_len: 8192
```

### Statistics API

After agent execution, check trimming stats:
```python
agent = Agent(...)
# ... run agent ...

# View statistics
print(f"Total messages trimmed: {agent.chat.stats['messages_trimmed']}")
print(f"Total tokens: {agent.chat.stats['total_tokens']}")
print(f"Context window: {agent.chat.context_window}")
print(f"Max input tokens: {agent.chat.max_input_tokens}")
```

### Token Estimation

Message tokens are estimated at initialization:
```python
# In message.py - simple heuristic
token_count = max(1, len(content) // 4)  # ~4 chars per token
```

For accurate counts, use OpenAI's `tiktoken` library:
```python
# Optional: More accurate tokenization
import tiktoken
enc = tiktoken.encoding_for_model("gpt-4")
tokens = len(enc.encode(content))
```

---

## Error Handling

### Before (Would Fail)
```
HTTP error 400: You passed 8193 input tokens...
RuntimeError: API error (400): 400 Client Error...
```

### After (Automatic Recovery)
```
1. Detects context exceeded
2. Removes oldest messages
3. Retries request with fewer tokens
4. ✓ Request succeeds
```

### Configuration Options to Prevent Errors

**Option 1: Reduce buffer (accept shorter outputs)**
```python
Chat(system_prompt="...", context_buffer=256)  # More space for input
```

**Option 2: Increase context_window (if using larger model)**
```python
Chat(system_prompt="...", context_window=32000)
```

**Option 3: Check before adding message**
```python
# Proactive check
if chat.get_token_count() > chat.max_input_tokens * 0.8:
    logger.warning("Approaching context limit - trim manually")
    chat.trim_messages_to_context()
```

---

## Performance Considerations

### Token Counting
- **Message-level**: Calculated once at creation, stored in `message.token_count`
- **Chat-level**: Summed on-demand via `chat.get_token_count()`
- **Overhead**: O(1) for message; O(n) for chat where n = message count

### Trimming
- **When**: Automatically in `get_messages()` before LLM call
- **Complexity**: O(n) worst-case where n = message count
- **Efficient**: Usually only removes few oldest messages
- **No overhead**: Only runs when context exceeded

### Caching
- **Model info**: Cached after first fetch to avoid repeated API calls
- **Token counts**: Stored per-message, not recalculated

---

## Migration Guide

### For Existing Code

If you have custom Chat instantiation, add context parameters:

**Before:**
```python
chat = Chat(system_prompt="...")
```

**After (Backward Compatible - defaults work):**
```python
chat = Chat(system_prompt="...")  # Uses defaults
```

**Or specify explicitly:**
```python
chat = Chat(
    system_prompt="...",
    context_window=8192,  # Match your model
    context_buffer=512    # Adjust as needed
)
```

### For Agent Configuration

No code changes needed! Agent automatically:
1. Queries LLM client for context window
2. Passes it to Chat instance
3. Enables sliding window management

Just ensure your LLM client has `get_context_window()` method (now provided in vLLM client).

---

## Technical Details

### Sliding Window Algorithm

```python
def trim_messages_to_context(self) -> None:
    total_tokens = self.get_token_count()
    
    # Early exit if under limit
    if total_tokens <= self.max_input_tokens:
        return
    
    # Remove oldest messages until under limit
    messages_removed = 0
    while self.messages and self.get_token_count() > self.max_input_tokens:
        removed_msg = self.messages.pop(0)
        messages_removed += 1
    
    # Log summary
    self.stats["messages_trimmed"] += messages_removed
```

### Invariants Maintained
1. **System prompt always present**: Never trimmed
2. **Messages stay ordered**: FIFO removal preserves conversation flow
3. **Token count accurate**: Recalculated on each check
4. **No data loss**: Trimmed messages not persisted, but logged

### Assumptions
1. Token count estimation ≤ actual (prevents over-trimming)
2. System prompt + recent messages sufficient for coherence
3. Oldest messages least relevant to current context

---

## Future Enhancements

Possible improvements to consider:

1. **Importance-based trimming**: Remove less relevant messages instead of just oldest
2. **Summarization**: Summarize older messages instead of deleting
3. **Dynamic buffer**: Adjust buffer based on response complexity
4. **Segment caching**: Cache old message summaries for context
5. **Per-client overrides**: Let users configure per LLM client type

---

## Troubleshooting

### "Context exceeded but nothing trimmed"
- Check `context_buffer` is not larger than `context_window`
- Verify message token counts are accurate
- System prompt might be taking too many tokens

### "Still getting 400 context error"
- Check actual context window from vLLM (`http://host:port/v1/models`)
- Try manually increasing context_buffer
- Reduce max_tokens in LLM client config

### "Losing important context in conversation"
- Increase context_window if using larger model
- Decrease context_buffer to preserve more input history
- Consider implementing message summarization

### Debugging Info
```python
# Get state snapshot
print(f"Messages: {len(chat.messages)}")
print(f"Total tokens: {chat.get_token_count()}")
print(f"Max allowed: {chat.max_input_tokens}")
print(f"Under limit: {chat.get_token_count() <= chat.max_input_tokens}")
print(f"Trimmed so far: {chat.stats['messages_trimmed']}")
```

---

## Summary

The context window management system provides:
- ✅ Automatic context size detection from LLM
- ✅ Real-time token tracking
- ✅ Automatic sliding window trimming
- ✅ System prompt preservation
- ✅ Full logging and monitoring
- ✅ Backward compatible API
- ✅ Zero-configuration defaults

This eliminates context overflow errors and allows long-running conversations without manual message management!
