# Yukta - Modular AI Agent Framework

> A comprehensive, modular AI agent system with **multi-LLM support**, **intelligent memory management**, **real-time chat persistence**, **tool integration**, and **automatic chat history saving**.

![Python 3.8+](https://img.shields.io/badge/Python-3.8%2B-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-2.1.0-brightgreen)

## Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Supported LLM Clients](#-supported-llm-clients)
- [Installation](#-installation)
  - [Option 1: Pip Installation](#option-1-pip-installation)
  - [Option 2: Direct Git Installation](#option-2-direct-git-installation)
  - [Option 3: Git Clone & Local Install](#option-3-git-clone--local-install)
- [Quick Start](#-quick-start)
- [Usage Examples](#-usage-examples)
  - [1. Basic Agent Creation](#1-basic-agent-creation)
  - [2. Agent with Custom Tools](#2-agent-with-custom-tools)
  - [3. Multi-turn Conversations](#3-multi-turn-conversations)
  - [4. Chat Persistence](#4-chat-persistence)
  - [5. Working with Memory](#5-working-with-memory)
  - [6. Multiple LLM Clients](#6-multiple-llm-clients)
  - [7. Remote Tools (MCP)](#7-remote-tools-mcp)
- [Architecture](#-architecture)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)

## 📖 Overview

Yukta is a production-ready AI agent framework that enables you to build sophisticated AI agents with:

- **Multiple LLM backends** (Ollama, vLLM, LM Studio, OpenAI, Hugging Face, and more)
- **Real-time chat persistence** automatically saving conversations
- **Custom tool integration** for agent decision-making and actions
- **Memory management** to handle context and conversation history
- **Modular architecture** for easy extension and customization

Whether you're building a financial advisor, customer service bot, data analyst, or research assistant, Yukta provides the foundation you need.

---

## ✨ Key Features

### 🤖 Multi-LLM Support
- **7+ LLM Client Types**: Ollama, vLLM, LM Studio, Remote Endpoints, OpenAI, HuggingFace, SGLang
- **Flexible LLM Integration**: Easy switching between different LLM backends
- **Streaming Support**: Real-time token streaming for interactive responses
- **Tool Calling**: Built-in support for function calling and tool execution
- **Multi-turn Conversations**: Maintain context across multiple interactions

### 💾 Chat Persistence
- **Real-Time Auto-Save**: Messages saved immediately as they're added
- **Agent-Organized Structure**: Chat files organized in `chats/{agent_name}/` folders
- **Smart Filenames**: Meaningful filenames generated from first user message
- **Zero Manual Intervention**: Chat history saves automatically
- **Configuration-Driven**: Enable/disable auto-save with simple config options

**Example saved chat structure:**
```
./chats/
└── WeatherAgent/
    ├── tell_me_weather_in_london_20260316_115708.json
    └── is_it_going_to_rain_tomorrow_20260316_120934.json
```

### 🛠️ Tool Integration
- **Custom Tools**: Define and register your own tool functions
- **Remote Tools**: Connect to remote MCP (Model Context Protocol) endpoints
- **Tool Parameters**: Strongly-typed parameter definitions with descriptions
- **Automatic Execution**: LLM can invoke tools and use results for reasoning

### 💾 Memory Management
- **Intelligent Context Handling**: Efficient message storage with context preservation
- **Configurable Capacity**: Set max tokens or message limits
- **Token Tracking**: Automatic token usage calculation
- **Searchable History**: Query chat history by content or metadata

### 📊 Logging & Configuration
- **Dual Logging System**: Separate logging for Agent and Memory operations
- **Configurable Log Levels**: DEBUG, INFO, WARNING, ERROR support
- **Performance Monitoring**: Track agent execution and token usage
- **Verbose Mode**: Detailed output for debugging

---

## 🌐 Supported LLM Clients

| Client | Type | Use Case | Default URL/Setup |
|--------|------|----------|-------------------|
| **Ollama** | Local | Lightweight local models (Qwen, Llama, Mistral) | `http://localhost:11434` |
| **vLLM** | Local | High-performance batch inference | `http://localhost:8000` |
| **LM Studio** | Local | Desktop GUI with easy model management | `http://localhost:1234` |
| **Remote Endpoint** | Remote | OpenAI-compatible APIs, custom servers | Custom URL |
| **OpenAI** | Cloud | GPT-4, GPT-3.5 models | Cloud API |
| **HuggingFace** | Cloud | Community models via HuggingFace API | Cloud API |
| **SGLang** | Local | Structured generation server | `http://localhost:30000` |

---

## 📦 Installation

### Option 1: Pip Installation

**Latest stable release (when published):**

```bash
pip install yukta
```

### Option 2: Direct Git Installation

**Install directly from GitHub without cloning:**

```bash
# Install latest from main branch
pip install git+https://github.com/VCoder4646/yukta.git

# Install from specific branch
pip install git+https://github.com/VCoder4646/yukta.git@<branch-name>

# Install from specific commit
pip install git+https://github.com/VCoder4646/yukta.git@<commit-hash>
```

### Option 3: Git Clone & Local Install

**For development or latest features:**

```bash
# Clone the repository
git clone https://github.com/VCoder4646/yukta.git
cd yukta

# Install in development mode (editable)
pip install -e .
```

**Install from specific branch:**

```bash
git clone -b <branch-name> https://github.com/VCoder4646/yukta.git
cd yukta
pip install -e .
```

**Verify installation:**

```bash
python -c "from yukta import Agent, AgentBuilder; print('✅ Yukta installed successfully!')"
```

---

## 🚀 Quick Start

### Minimal Example (5 lines)

```python
from yukta import create_agent
from yukta.core.Clients import OllamaClient

# Create agent with Ollama
agent = create_agent(
    name="AssistantBot",
    system_prompt="You are a helpful assistant.",
    llm_client=OllamaClient(model_name="qwen:4b")
)

# Chat with agent
response = agent.invoke("What is Python?", use_llm=True)
print(response)
```

---

## 📚 Usage Examples

### 1. Basic Agent Creation

Create a simple agent with system prompt:

```python
from yukta import create_agent, SystemPrompt
from yukta.core.Clients import OllamaClient

# Define system prompt
system_prompt = SystemPrompt(
    name="FinanceAdvisor",
    prompt="You are a financial advisor. Help users with investment decisions."
)

# Initialize LLM client
llm_client = OllamaClient(
    base_url="http://localhost:11434",
    model_name="mistral"
)

# Create agent
agent = create_agent(
    name="FinanceAdvisor",
    system_prompt=system_prompt,
    llm_client=llm_client
)

# Use the agent
response = agent.invoke("Should I invest in tech stocks?", use_llm=True)
print(f"Advisor: {response}")
```

---

### 2. Agent with Custom Tools

Give your agent custom abilities:

```python
from yukta import create_agent
from yukta.tools import Tool, ToolParameter, ToolProcessor, ToolType
from yukta.core.Clients import OllamaClient
from yukta.config import AgentConfig
import logging

# Create tool processor
tools_processor = ToolProcessor()

# Define a custom tool
def get_stock_price(symbol: str) -> str:
    """Get mock stock price"""
    prices = {"AAPL": 150.25, "GOOGL": 140.80, "MSFT": 380.50}
    price = prices.get(symbol, "Unknown")
    return f"Current price of {symbol}: ${price}"

# Add tool to processor
tools_processor.add_tool(
    Tool(
        name="get_stock_price",
        description="Get the current price of a stock by symbol",
        parameters=[
            ToolParameter(
                name="symbol",
                type="string",
                description="Stock ticker symbol (e.g., AAPL, GOOGL, MSFT)",
                required=True
            )
        ],
        tool_type=ToolType.CUSTOM,
        function=get_stock_price
    )
)

# Create agent with tools
config = AgentConfig(
    auto_save_chat_history=True,
    chat_history_dir="./chats",
    log_level=logging.INFO,
    verbose=True
)

agent = create_agent(
    name="StockAnalyzer",
    system_prompt="You are a stock analysis expert. Use the get_stock_price tool to get prices.",
    tools_processor=tools_processor,
    llm_client=OllamaClient(model_name="neural-chat"),
    config=config
)

# Agent will automatically use tools
response = agent.invoke(
    "What are the current prices of AAPL and GOOGL?",
    use_llm=True,
    max_iterations=5  # Allow multiple tool calls
)
print(response)
```

---

### 3. Multi-turn Conversations

Have extended conversations with context:

```python
from yukta import create_agent
from yukta.core.Clients import OllamaClient

agent = create_agent(
    name="ChatBot",
    system_prompt="You are a friendly assistant. Remember context from previous messages.",
    llm_client=OllamaClient(model_name="neural-chat")
)

# Multi-turn conversation
questions = [
    "My name is Alice and I work in finance.",
    "What industry am I in?",  # Agent remembers context
    "What role might suit someone like me?",  # Continues the conversation
]

for question in questions:
    print(f"\nUser: {question}")
    response = agent.invoke(question, use_llm=True)
    print(f"Agent: {response}")
```

---

### 4. Chat Persistence

Automatically save and load conversations:

```python
from yukta import create_agent, AgentConfig
from yukta.core.Clients import OllamaClient

config = AgentConfig(
    auto_save_chat_history=True,      # Enable auto-save
    chat_history_dir="./chats",       # Save directory
    verbose=True
)

agent = create_agent(
    name="ResearchAssistant",
    system_prompt="You are a research assistant.",
    llm_client=OllamaClient(model_name="qwen:7b"),
    config=config
)

# This conversation will be automatically saved
response1 = agent.invoke("What is quantum computing?", use_llm=True)
response2 = agent.invoke("How does it differ from classical computing?", use_llm=True)

# Chat is automatically saved to: ./chats/ResearchAssistant/[generated_filename].json
print(f"Chat saved automatically!")
print(f"Chat location: ./chats/{agent.agent_name}/")

# Get chat statistics
stats = agent.get_chat_stats()
print(f"\nChat Statistics:")
print(f"  Total Messages: {stats.get('total_messages', 0)}")
print(f"  User Messages: {stats.get('user_messages', 0)}")
print(f"  Agent Messages: {stats.get('agent_messages', 0)}")
print(f"  Total Tokens: {stats.get('total_tokens', 0)}")
```

---

### 5. Working with Memory

Manage agent knowledge and context:

```python
from yukta import create_agent, create_memory, AgentConfig
from yukta.core.Clients import OllamaClient

# Create memory with capacity
memory = create_memory(
    system_prompt="You are a helpful assistant.",
    max_tokens=2048,  # Maximum context window
    storage_type="json"
)

config = AgentConfig(
    auto_save_chat_history=True,
    verbose=False
)

# Create agent with memory
agent = create_agent(
    name="MemoryAgent",
    system_prompt="Remember important details from past conversations.",
    llm_client=OllamaClient(model_name="neural-chat"),
    config=config
)
agent.set_memory(memory)

# Have conversations - memory tracks everything
agent.invoke("My favorite color is blue.", use_llm=True)
agent.invoke("What's my favorite color?", use_llm=True)

# Save memory for later
memory.save("./memory_state.json")

# Load memory later
from yukta import load_memory
loaded_memory = load_memory("./memory_state.json")
```

---

### 6. Multiple LLM Clients

Easy switching between different LLM providers:

```python
from yukta import create_agent, AgentConfig
from yukta.core.Clients import (
    OllamaClient, VLLMClient, LMStudioClient, 
    RemoteEndpointClient
)

config = AgentConfig(verbose=True)

# Option 1: Ollama (lightweight)
ollama_agent = create_agent(
    name="OllamaBot",
    system_prompt="You are helpful.",
    llm_client=OllamaClient(
        base_url="http://localhost:11434",
        model_name="mistral"
    ),
    config=config
)

# Option 2: vLLM (high performance)
vllm_agent = create_agent(
    name="vLLMBot",
    system_prompt="You are helpful.",
    llm_client=VLLMClient(
        base_url="http://localhost:8000",
        model_name="meta-llama/Llama-2-7b-hf"
    ),
    config=config
)

# Option 3: LM Studio (GUI-based)
lmstudio_agent = create_agent(
    name="LMStudioBot",
    system_prompt="You are helpful.",
    llm_client=LMStudioClient(
        base_url="http://localhost:1234",
        model_name="any-model"  # Auto-detects from LM Studio
    ),
    config=config
)

# Option 4: Remote OpenAI-compatible endpoint
remote_agent = create_agent(
    name="RemoteBot",
    system_prompt="You are helpful.",
    llm_client=RemoteEndpointClient(
        base_url="https://api.example.com/v1",
        api_key="your-api-key",
        model_name="gpt-4"
    ),
    config=config
)

# All agents work the same way
for agent in [ollama_agent, vllm_agent, lmstudio_agent]:
    response = agent.invoke("Hello!", use_llm=True)
    print(f"{agent.agent_name}: {response}\n")
```

---

### 7. Remote Tools (MCP)

Connect to remote Model Context Protocol endpoints:

```python
from yukta import create_agent
from yukta.tools import create_remote_mcp_tool, ToolProcessor
from yukta.core.Clients import OllamaClient
from yukta.config import AgentConfig

# Create tool processor
tools_processor = ToolProcessor()

# Add remote MCP tool
weather_tool = create_remote_mcp_tool(
    name="get_weather",
    description="Get weather for a city",
    endpoint="http://localhost:8000/tools/get_weather",
    parameters=[
        {
            "name": "city",
            "type": "string",
            "required": True,
            "description": "City name"
        }
    ]
)
tools_processor.add_tool(weather_tool)

# Add another remote tool
convert_tool = create_remote_mcp_tool(
    name="convert_currency",
    description="Convert between currencies",
    endpoint="http://localhost:8000/tools/convert_currency",
    parameters=[
        {"name": "amount", "type": "number", "required": True},
        {"name": "from_currency", "type": "string", "required": True},
        {"name": "to_currency", "type": "string", "required": True},
        {"name": "rate", "type": "number", "required": True}
    ]
)
tools_processor.add_tool(convert_tool)

# Create agent with remote tools
config = AgentConfig(
    auto_save_chat_history=True,
    verbose=True
)

agent = create_agent(
    name="TravelAssistant",
    system_prompt="Use tools to help with travel planning and currency conversion.",
    tools_processor=tools_processor,
    llm_client=OllamaClient(model_name="neural-chat"),
    config=config
)

# Agent will call remote tools as needed
response = agent.invoke(
    "What's the weather in London? Also convert 100 USD to GBP at rate 0.79",
    use_llm=True,
    max_iterations=5
)
print(response)
```

---

### Complete Example: Financial Analysis Agent

A complete, production-ready example:

```python
from yukta import create_agent, AgentConfig
from yukta.tools import Tool, ToolParameter, ToolProcessor, ToolType
from yukta.core.Clients import OllamaClient
from yukta.config import SystemPrompt
import logging

# Setup System Prompt
system_prompt = SystemPrompt(
    "FinanceAnalyst",
    """You are an expert financial analyst. Your responsibilities:
    - Analyze stock data and trends
    - Provide investment recommendations
    - Explain financial concepts clearly
    - Use tools to get current stock information
    
    When asked about stocks, always use the available tools to get prices and data.
    Be cautious with recommendations and include risk disclaimers."""
)

# Setup Tools
tools_processor = ToolProcessor()

# Mock data for example
STOCK_DATA = {
    "AAPL": {"price": 150.25, "pe": 28.5, "market_cap": "2.4T"},
    "GOOGL": {"price": 140.80, "pe": 25.2, "market_cap": "1.8T"},
    "MSFT": {"price": 380.50, "pe": 32.1, "market_cap": "2.8T"},
}

def analyze_stock(symbol: str) -> str:
    """Analyze a stock and return key metrics"""
    data = STOCK_DATA.get(symbol.upper())
    if data:
        return f"{symbol}: Price=${data['price']}, P/E={data['pe']}, Market Cap={data['market_cap']}"
    return f"Stock {symbol} not found in database"

# Add tools
tools_processor.add_tool(
    Tool(
        name="analyze_stock",
        description="Get analysis data for a stock",
        parameters=[
            ToolParameter(
                name="symbol",
                type="string",
                description="Stock ticker symbol",
                required=True
            )
        ],
        tool_type=ToolType.CUSTOM,
        function=analyze_stock
    )
)

# Setup Configuration
config = AgentConfig(
    auto_save_chat_history=True,
    chat_history_dir="./financial_chats",
    log_level=logging.INFO,
    enable_logging=True,
    verbose=True
)

# Create Agent
agent = create_agent(
    name="FinanceAnalyst",
    system_prompt=system_prompt,
    tools_processor=tools_processor,
    llm_client=OllamaClient(model_name="neural-chat"),
    config=config
)

# Run Analysis
queries = [
    "What's the current status of Apple stock?",
    "Compare AAPL and MSFT for investment potential",
    "Which tech stock looks best right now?"
]

print("="*70)
print("FINANCIAL ANALYSIS AGENT")
print("="*70)

for query in queries:
    print(f"\n📊 Query: {query}\n")
    response = agent.invoke(
        query,
        use_llm=True,
        max_iterations=5
    )
    print(f"💡 Analysis:\n{response}\n")
    print("-"*70)

# Get statistics
stats = agent.get_chat_stats()
print(f"\n📈 Session Statistics:")
print(f"   Total messages: {stats.get('total_messages', 0)}")
print(f"   Tool calls: {stats.get('tool_calls', 0)}")
print(f"   Total tokens: {stats.get('total_tokens', 0)}")
```

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────┐
│           User Application                      │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────▼──────────┐
        │   Agent (Core)     │
        │  - Orchestration   │
        │  - Tool Calling    │
        │  - Memory Mgmt     │
        └─────────┬──────────┘
                  │
    ┌─────────────┼──────────────┐
    │             │              │
┌───▼──┐    ┌────▼──────┐  ┌───▼────┐
│Tools │    │LLM Client │  │ Memory  │
│      │    │           │  │         │
│Custom│    │ Ollama    │  │ Storage │
│Remote│    │ vLLM      │  │ Indexing│
└──────┘    │ LM Studio │  │ Search  │
            │ OpenAI    │  └─────────┘
            │ Others...  │
            └────────────┘
```

### Module Structure

| Module | Purpose |
|--------|---------|
| `core/Agent` | Main agent logic and orchestration |
| `core/Chat` | Chat management and persistence |
| `core/Memory` | Context and memory management |
| `core/Clients` | LLM client implementations |
| `tools/` | Tool definition and processing |
| `config/` | Configuration and prompts |
| `instrumentation/` | Logging and tracing |

---

## ⚙️ Configuration

### AgentConfig Options

```python
from yukta import AgentConfig
import logging

config = AgentConfig(
    # Chat Persistence
    auto_save_chat=False,                    # Legacy: disable UUID-based saving
    auto_save_chat_history=True,             # New: enable smart saving
    chat_history_dir="./chats",              # Where to save chats
    
    # Logging
    log_level=logging.INFO,                  # Agent log level
    enable_logging=True,                     # Enable agent logging
    memory_log_level=logging.DEBUG,          # Memory log level
    enable_memory_logging=True,              # Enable memory logging
    
    # Display
    verbose=True,                            # Show detailed output
    
    # Model Parameters
    max_retries=3,                           # Retry failed LLM calls
    timeout=30,                              # Request timeout (seconds)
)
```

### Environment Variables

```bash
# LLM Endpoints
OLLAMA_API_BASE=http://localhost:11434
VLLM_API_BASE=http://localhost:8000
LM_STUDIO_API_BASE=http://localhost:1234

# API Keys
OPENAI_API_KEY=your_key_here
HUGGINGFACE_API_KEY=your_key_here

# Memory
MEMORY_STORAGE_DIR=./memory
MAX_MEMORY_TOKENS=4096
```

---

## 📖 API Reference

### Core Classes

#### Agent
```python
agent = create_agent(
    name: str,
    system_prompt: Union[str, SystemPrompt],
    llm_client: BaseLLMClient,
    tools_processor: ToolProcessor = None,
    config: AgentConfig = None,
    memory: Memory = None
)

# Methods
agent.invoke(input: str, use_llm: bool = True, max_iterations: int = 5) -> str
agent.get_chat_stats() -> dict
agent.set_memory(memory: Memory) -> None
agent.save_chat(filepath: str) -> None
agent.load_chat(filepath: str) -> None
```

#### Tool
```python
tool = Tool(
    name: str,
    description: str,
    parameters: List[ToolParameter],
    tool_type: ToolType,
    function: Callable
)

# Tool Processor
processor = ToolProcessor()
processor.add_tool(tool)
processor.remove_tool(name: str)
processor.execute_tool(name: str, **kwargs) -> Any
```

#### Memory
```python
memory = create_memory(
    system_prompt: str,
    max_tokens: int = 2048,
    storage_type: str = "json"
)

memory.add_message(role: str, content: str) -> None
memory.get_context() -> str
memory.search(query: str) -> List[str]
memory.save(filepath: str) -> None
```

---

## 🛠️ Development & Contribution

### Running Tests

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest tests/

# Run with coverage
pytest --cov=yukta tests/
```

### Code Style

```bash
# Format code
black yukta/

# Lint
flake8 yukta/

# Type checking
mypy yukta/
```

### Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🤝 Support & Community

- **Documentation**: See docs/ directory and markdown files
- **Examples**: Check examples/ for more usage patterns
- **Issues**: Report bugs on GitHub
- **Discussions**: Join community discussions

---

## 🚀 Roadmap

- [ ] Web UI for agent management
- [ ] Advanced multi-agent interactions
- [ ] Vector database integration
- [ ] Fine-tuning helpers
- [ ] Kubernetes deployment templates
- [ ] Performance benchmarking suite

---

## 👨‍💻 Author

Created by **VCoder4646** - [vasanthwork0475@gmail.com](mailto:vasanthwork0475@gmail.com)

For updates and more projects, follow on GitHub: [@VCoder4646](https://github.com/VCoder4646)

---

## 📝 Changelog

### Version 2.1.0 (Current)
- Real-time chat persistence with meaningful filenames
- Agent-organized chat directory structure
- Configuration-driven auto-save
- Improved memory management
- Enhanced tool integration

### Version 2.0.0
- Multi-LLM client support
- Tool calling and execution
- Memory management system
- Chat persistence foundation

### Version 1.0.0
- Initial release
- Basic agent framework
- System prompt support

