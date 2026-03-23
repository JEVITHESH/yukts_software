# Yukta - Quick Import Reference

## Package Layout
```
yukta/
├── core/       # Agent, Memory, Message, LLMClient
├── tools/      # ToolProcessor, Tool, Utils
├── config/     # Config, SystemPrompt
└── cli/        # Chat, ChatManager
```

## Common Imports

### Option 1: Use convenience imports from main package
```python
from yukta import (
    Agent, AgentBuilder, AgentConfig,
    Memory, MemoryConfig,
    SystemPrompt, SystemPromptLibrary,
    Tool, ToolProcessor, ToolType,
    Config, Chat
)
```

### Option 2: Import from specific modules
```python
# Core functionality
from yukta.core import Agent, Memory, Message, LLMClient

# Tools
from yukta.tools import ToolProcessor, Tool, ToolType, setup_logging

# Configuration
from yukta.config import Config, SystemPrompt

# CLI
from yukta.cli import Chat, ChatManager
```

## Quick Examples

### Create Agent
```python
from yukta import create_agent
agent = create_agent("MyAgent", "yukta")
```

### Create Agent with Memory
```python
from yukta import create_agent, create_memory

agent = create_agent("MyAgent")
memory = create_memory("You are helpful.", max_tokens=1000)
agent.set_memory(memory)
```

### Custom System Prompt
```python
from yukta.config import SystemPrompt

prompt = SystemPrompt("agent_name", "Custom instructions here")
```

## Installation

### Development Mode
```bash
pip install -e .
```

### With Optional Dependencies
```bash
# All extras
pip install -e ".[all]"

# Specific extras
pip install -e ".[dev,llm,data]"
```

## Module Purpose

| Module | Purpose |
|--------|---------|
| `core` | Core agent functionality (Agent, Memory, Message, LLMClient) |
| `tools` | Tool processing and utility functions |
| `config` | Configuration and system prompt management |
| `cli` | Command-line interface and chat management |

## File Locations

| File | Old Location | New Location |
|------|-------------|--------------|
| agent.py | root | yukta/core/ |
| memory.py | root | yukta/core/ |
| message.py | root | yukta/core/ |
| llm_client.py | root | yukta/core/ |
| tools_pro.py | root | yukta/tools/ |
| utils.py | root | yukta/tools/ |
| config.py | root | yukta/config/ |
| system_prompt.py | root | yukta/config/ |
| chat.py | root | yukta/cli/ |
## Key Benefits
✅ Professional package structure
✅ Clear module organization
✅ Easy to install and distribute
✅ Better IDE support and autocomplete
✅ Scalable architecture
✅ Proper namespace management

## Need Help?
- See `PROJECT_STRUCTURE.md` for detailed documentation
- See `README.md` for feature overview
- Check `examples/sample.py` for usage examples
