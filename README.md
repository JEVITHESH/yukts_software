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
  - [Quick Install](#quick-install-single-command)
  - [Installation Methods](#installation-methods)
  - [Verify Installation](#verify-installation)
  - [What Gets Installed](#-what-gets-installed)
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

### 📡 Observability & Tracing
- **OpenTelemetry Integration**: Full distributed tracing support
- **Phoenix APM Monitoring**: Real-time performance monitoring
- **Execution Metrics**: Track tool calls, LLM performance, and timings
- **Production-Ready Instrumentation**: Built-in tracing infrastructure

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

### Quick Install (Single Command)

All necessary packages are **installed by default** - no optional extras needed!

```bash
# Navigate to project directory
cd yukta

# Install (choose one method)
pip install .                    # Standard install
pip install -e .                # Development mode (editable)
pip install -r requirements.txt  # From requirements file
```

**That's it!** All 17 essential packages are installed automatically.

### Installation Methods

#### Option 1: Pip Installation (Latest Release)

```bash
# Install latest stable release (when published)
pip install yukta
```

#### Option 2: Direct Git Installation

```bash
# Install latest from main branch
pip install git+https://github.com/VCoder4646/yukta.git

# Install from specific branch
pip install git+https://github.com/VCoder4646/yukta.git@<branch-name>
```

#### Option 3: Git Clone & Local Install

```bash
# Clone the repository
git clone https://github.com/VCoder4646/yukta.git
cd yukta

# Install in development mode (editable)
pip install -e .

# Optional: Install with development tools for contributing
pip install -e ".[dev]"
```

### ✅ Verify Installation

Run the verification script to ensure all packages are installed:

```bash
# From the yukta directory
python verify_unified_installation.py
```

**Expected output:**
```
======================================================================
YUKTA UNIFIED INSTALLATION VERIFICATION
======================================================================

[Core Packages]
  ✓ requests                       (requests)
  ✓ httpx                          (httpx)
  ✓ python-dotenv                  (dotenv)

[LLM Provider Support]
  ✓ openai                         (openai)
  ✓ anthropic                      (anthropic)
  
[... more packages ...]

======================================================================
Results: 17/17 packages installed
======================================================================

✅ ALL PACKAGES INSTALLED SUCCESSFULLY!
```

### 📦 What Gets Installed

**17 Essential Packages** are installed by default:

#### Core Utilities (3)
- `requests` - HTTP requests
- `httpx` - Async HTTP client
- `python-dotenv` - Environment variables

#### LLM Provider Support (2)
- `openai` - OpenAI API
- `anthropic` - Anthropic Claude

#### Model Context Protocol (1)
- `mcp` - Remote tools support (includes SSE)

#### Data & Databases (5)
- `pandas` - DataFrames and analysis
- `numpy` - Numerical computing
- `sqlalchemy` - SQL ORM
- `psycopg2-binary` - PostgreSQL database driver
- `pymilvus` - Milvus vector database

#### Async & HTTP (1)
- `aiohttp` - Async HTTP operations

#### Observability & Tracing (4)
- `opentelemetry-api` - Tracing API
- `opentelemetry-sdk` - Tracing SDK
- `openinference-semantic-conventions` - Standard conventions
- `arize-phoenix` - APM monitoring

#### Development Tools (Optional)
- `pytest`, `pytest-cov`, `black`, `flake8`, `mypy` - Install with `pip install -e ".[dev]"`

---

## 🚀 Quick Start

### Minimal Example (5 lines)

```python
from yukta import create_agent
from yukta.core.Clients.ollama_client import OllamaClient

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
from yukta.core.Clients.ollama_client import OllamaClient

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
from yukta.core.Clients.ollama_client import OllamaClient
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
    log_level=logging.INFO,
    enable_logging=True,
    verbose=True
)

agent = create_agent(
    name="StockAnalyzer",
    system_prompt="You are a stock price analyzer. Use the get_stock_price tool to check prices.",
    llm_client=OllamaClient(model_name="mistral"),
    tools_processor=tools_processor,
    config=config
)

# Use agent with tools
response = agent.invoke("What is the price of Apple stock?", use_llm=True, max_iterations=5)
print(response)
```

---

### 3. Multi-turn Conversations

Maintain conversation context across multiple turns:

```python
from yukta import create_agent
from yukta.core.Clients.ollama_client import OllamaClient

agent = create_agent(
    name="ChatBot",
    system_prompt="You are a helpful assistant.",
    llm_client=OllamaClient(model_name="qwen:4b")
)

# Multiple turns - context is maintained
response1 = agent.invoke("My name is Alice", use_llm=True)
print(f"Agent: {response1}")

response2 = agent.invoke("What's my name?", use_llm=True)
print(f"Agent: {response2}")  # Agent remembers "Alice"

response3 = agent.invoke("Tell me a joke", use_llm=True)
print(f"Agent: {response3}")
```

---

### 4. Chat Persistence

Auto-save chat history with meaningful filenames:

```python
from yukta import create_agent, AgentConfig
from yukta.core.Clients.ollama_client import OllamaClient

config = AgentConfig(
    auto_save_chat_history=True,     # Enable auto-save
    chat_history_dir="./chats",      # Save to ./chats
    verbose=True
)

agent = create_agent(
    name="PersistentBot",
    system_prompt="You are a helpful assistant",
    llm_client=OllamaClient(model_name="qwen:4b"),
    config=config
)

# Chats are automatically saved to ./chats/PersistentBot/
# with meaningful filenames like: "how_to_learn_python_20260413_101234.json"
response = agent.invoke("How do I learn Python?", use_llm=True)
print(response)

# Chat files saved to:
# ./chats/PersistentBot/how_to_learn_python_20260413_101234.json
```

---

### 5. Working with Memory

Configure memory for intelligent context management:

```python
from yukta import create_agent, create_memory
from yukta.core.Clients.ollama_client import OllamaClient

# Create memory with 4096 token limit
memory = create_memory(
    system_prompt="You are a helpful assistant specialized in Python.",
    max_tokens=4096,
    storage_type="json"
)

agent = create_agent(
    name="PythonExpert",
    system_prompt="You are a Python expert",
    llm_client=OllamaClient(model_name="mistral"),
    memory=memory
)

# Memory automatically manages context
response = agent.invoke("Explain decorators in Python", use_llm=True)
print(response)

# Memory can be saved and loaded
memory.save("python_memory.json")
```

---

### 6. Multiple LLM Clients

Switch between different LLM backends:

```python
from yukta import create_agent
from yukta.core.Clients.llmclientfactory import LLMClientFactory, ModelType

# Create agents with different backends

# Ollama Agent
ollama_agent = create_agent(
    name="OllamaBot",
    system_prompt="You are helpful",
    llm_client=LLMClientFactory.create_client(ModelType.OLLAMA, model_name="qwen:4b")
)

# vLLM Agent (OpenAI-compatible)
vllm_agent = create_agent(
    name="vLLMBot",
    system_prompt="You are helpful",
    llm_client=LLMClientFactory.create_client(
        ModelType.VLLM,
        model_name="meta-llama/Llama-2-7b",
        api_base="http://localhost:8000"
    )
)

# OpenAI Agent
openai_agent = create_agent(
    name="GPTBot",
    system_prompt="You are helpful",
    llm_client=LLMClientFactory.create_client(
        ModelType.OPENAI,
        model_name="gpt-4",
        api_key="your_api_key_here"
    )
)

# All work the same way
response1 = ollama_agent.invoke("Hello", use_llm=True)
response2 = vllm_agent.invoke("Hello", use_llm=True)
response3 = openai_agent.invoke("Hello", use_llm=True)
```

---

### 7. Remote Tools (MCP)

Connect to remote Model Context Protocol servers:

```python
from yukta import create_agent
from yukta.tools import ToolProcessor
from yukta.core.Clients.ollama_client import OllamaClient

# Create tool processor with remote tools
tools_processor = ToolProcessor()

# Load remote MCP tools (if MCP server is running)
# The MCP tools are now available with unified installation!

agent = create_agent(
    name="RemoteToolBot",
    system_prompt="You are an assistant with remote tools",
    llm_client=OllamaClient(model_name="mistral"),
    tools_processor=tools_processor
)

response = agent.invoke("Use available tools to help me", use_llm=True, max_iterations=5)
print(response)
```

---

## 🏗️ Architecture

```
Yukta Agent System
├── Core
│   ├── Agent          # Main agent class
│   ├── Chat           # Chat message management
│   ├── Storage        # Persistence layer
│   └── Clients        # LLM client implementations
├── Tools
│   ├── Tool           # Tool definition
│   ├── ToolProcessor  # Tool execution
│   └── Parameters     # Parameter schemas
├── Config
│   ├── AgentConfig    # Configuration
│   ├── SystemPrompt   # System messages
│   └── Memory         # Context management
└── Instrumentation
    ├── Tracing        # Distributed tracing
    └── Decorators     # Observability hooks
```

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
ANTHROPIC_API_KEY=your_key_here

# Memory
MEMORY_STORAGE_DIR=./memory
MAX_MEMORY_TOKENS=4096

# Tracing (OpenTelemetry)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:6831
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
agent.invoke(input: str, use_llm: bool = True, max_iterations: int = 1) -> str
agent.get_chat_history() -> List[Message]
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
processor.list_tools() -> List[str]
```

#### LLMClientFactory
```python
from yukta.core.Clients.llmclientfactory import LLMClientFactory, ModelType

# Create clients for different backends
client = LLMClientFactory.create_client(
    ModelType.OLLAMA,           # or VLLM, LM_STUDIO, OPENAI, etc.
    model_name="qwen:4b",
    api_base="http://localhost:11434"
)
```

#### Memory
```python
from yukta import create_memory

memory = create_memory(
    system_prompt: str,
    max_tokens: int = 2048,
    storage_type: str = "json"
)

# Methods
memory.add_message(role: str, content: str) -> None
memory.get_context() -> str
memory.search(query: str) -> List[str]
memory.save(filepath: str) -> None
memory.load(filepath: str) -> None
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

# Run specific test file
pytest tests/test_agent.py -v
```

### Code Style

```bash
# Format code with Black
black yukta/

# Lint with Flake8
flake8 yukta/ --max-line-length=100

# Type checking with mypy
mypy yukta/ --ignore-missing-imports
```

### Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Format code: `black yukta/`
5. Run tests: `pytest tests/`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open Pull Request

---

## 📚 Documentation

Comprehensive guides and documentation files:

- **Installation**: [INSTALLATION_UNIFIED.md](INSTALLATION_UNIFIED.md) - Complete installation guide
- **Tracing & Observability**: See instrumentation examples
- **Tool Integration**: Check examples/ directory
- **Examples**: More usage patterns in examples/

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🤝 Support & Community

- **Documentation**: See docs/ directory and markdown files
- **Examples**: Check [examples/](examples/) for more usage patterns
- **Issues**: Report bugs on [GitHub Issues](https://github.com/VCoder4646/yukta/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/VCoder4646/yukta/discussions)

---

## 🚀 Roadmap

- [ ] Web UI for agent management
- [ ] Advanced multi-agent interactions
- [ ] Fine-tuning helpers
- [ ] Kubernetes deployment templates
- [ ] Performance benchmarking suite
- [ ] Extended LLM provider support

---

## 👨‍💻 Author

Created by **VCoder4646** - [vasanthwork0475@gmail.com](mailto:vasanthwork0475@gmail.com)

For updates and more projects, follow on GitHub: [@VCoder4646](https://github.com/VCoder4646)

---

## 📝 Changelog

### Version 2.1.0 (Current)
- ✅ **Unified Installation** - All 17 essential packages installed by default
- ✅ **OpenTelemetry Integration** - Full distributed tracing support
- ✅ **Phoenix APM** - Real-time performance monitoring
- ✅ **Real-time Chat Persistence** - Meaningful filenames with auto-save
- ✅ **Agent-organized Chat Structure** - Files organized by agent name
- ✅ **Enhanced Tool Integration** - MCP support with SSE
- ✅ **Database Support** - PostgreSQL + Milvus pre-installed
- Improved memory management
- Enhanced tool execution model

### Version 2.0.0
- Multi-LLM client support
- Tool calling and execution
- Memory management system
- Chat persistence foundation

### Version 1.0.0
- Initial release
- Basic agent framework
- System prompt support

---

**Last Updated**: April 14, 2024  
**Status**: ✅ Production Ready
