# Yukta - Modular AI Agent Framework

> A comprehensive, modular agent system with **multi-LLM support**, **intelligent memory management**, **real-time chat persistence**, **tool integration**, **automatic chat history saving**, and **comprehensive logging**.

![Python 3.8+](https://img.shields.io/badge/Python-3.8%2B-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-2.2.0-brightgreen)

## Table of Contents

- [Key Features](#-key-features)
- [What's New](#-whats-new)
- [Supported LLM Clients](#-supported-llm-clients)
- [Quick Start](#-quick-start)
- [Core Concepts](#-core-concepts)
- [Usage Examples](#-usage-examples)
- [Chat Persistence](#-chat-persistence)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)


## ✨ Key Features

### 🤖 Multi-LLM Support
- **7+ LLM Client Types**: Ollama, vLLM, LM Studio, Remote Endpoints, HuggingFace, SGLang, and custom
- **Flexible LLM Integration**: Easy switching between different LLM backends
- **Streaming Support**: Real-time token streaming for interactive responses
- **Tool Calling**: Built-in support for function calling and tool execution
- **Multi-turn Conversations**: Maintain context across multiple interactions

### 💾 Intelligent Memory & Persistence
- **Real-Time Chat Persistence**: Messages saved immediately as they're added
- **Agent-Organized Structure**: Chat files organized in `chats/{agent_name}/` folders
- **Auto-Generated Filenames**: Meaningful filenames generated from first user message
- **Smart Memory Management**: Efficient message storage with context preservation
- **Multi-turn Conversations**: Full conversation history management
- **Configuration-Driven**: Enable/disable auto-save with configuration options

### 🛠️ Tool Integration
- **Custom Tools**: Define and register custom tool functions
- **Tool Parameters**: Strongly-typed parameter definitions with descriptions
- **Tool Orchestration**: Centralized tool management and execution
- **Flexible Tool Types**: Support for custom, builtin, and remote MCP tools
- **Tool Results**: Automatic handling of tool execution and result formatting

### 📊 Logging & Configuration
- **Dual Logging System**: Separate logging for Agent and Memory operations
- **Configurable Log Levels**: DEBUG, INFO, WARNING, ERROR support
- **File Logging**: Optional log files for persistence
- **Performance Monitoring**: Track agent execution, memory operations, and token usage
- **Verbose Mode**: Detailed output for debugging and monitoring

### 🏗️ Architecture
- **Modular Design**: Clean separation of concerns
- **Builder Pattern**: Fluent interface for agent configuration
- **Type-Safe**: Full type hints throughout the codebase
- **Extensible**: Easy to add new LLM clients and tools
- **Storage Backends**: Pluggable storage system for chat persistence

## 🎯 What's New

### Version 2.2.0 - Real-Time Chat Persistence
- ✅ **Real-time Message Saving**: Chat updated immediately after each message (user, agent, tool)
- ✅ **Agent-Specific Organization**: Chats saved in `chats/{agent_name}/` structure
- ✅ **Auto-Generated Filenames**: Meaningful filenames from first message content
- ✅ **Configuration-Driven Auto-Save**: Enable/disable with `auto_save_chat_history` config
- ✅ **No UUID Files**: Removed UUID-based file naming, using meaningful names instead
- ✅ **Zero Manual Intervention**: Chat history saves automatically - no explicit calls needed

Example saved chat structure:
```
./chats/
└── TestAgent1/
    ├── what_will_be_the_price_of_aapl_stock_tomorrow_20260316_115708.json
    └── please_analyze_the_stock_20260316_120934.json
```

## 🌐 Supported LLM Clients

| Client | Type | Use Case | Default URL |
|--------|------|----------|-------------|
| **Ollama** | Local | Lightweight local models (Qwen, Llama, Mistral) | `http://localhost:11434` |
| **vLLM** | Local | High-performance inference engine | `http://localhost:8000` |
| **LM Studio** | Local | Desktop LLM with GUI | `http://localhost:1234` |
| **Remote Endpoint** | Remote | OpenAI-compatible APIs, local servers | *Custom* |
| **HuggingFace** | Cloud | HuggingFace Inference API | *Cloud* |
| **SGLang** | Local | Structured generation server | `http://localhost:30000` |
| **Custom** | Any | Your own LLM backend | *Custom* |

## 🚀 Quick Start

### 1. Installation

```bash
# Clone repository
git clone https://github.com/VCoder4646/yukta.git
cd yukta

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "from yukta import create_agent; print('✓ Yukta installed successfully!')"
```

### 2. Setup Ollama (Recommended for beginners)

```bash
# Install Ollama from https://ollama.ai
# Pull a model
ollama pull qwen2:3b
# Start the server (runs on http://localhost:11434)
ollama serve
```

### 3. Run Sample Agent

```bash
python examples/sample.py
```

This runs a **multi-turn conversation** with the agent:
- Question 1: "What will be the price of AAPL stock tomorrow?"
- Question 2: "Please analyze the stock price for GOOGL and give me your recommendation."
- Question 3: "Based on your analysis, should I invest in tech stocks?"

The chat is automatically saved to: `./chats/TestAgent1/[generated_filename].json`

## 💡 Core Concepts

### Agent
An autonomous agent that can:
- Reason about tasks using an LLM
- Execute tools based on LLM decisions
- Maintain conversation history
- Auto-save chat history in real-time

### Chat & Messages
- **System Message**: Agent's instructions/personality
- **User Messages**: Human input
- **Agent Messages**: LLM responses (may include tool calls)
- **Tool Messages**: Results from executed tools

### Tools
Functions the agent can call to accomplish tasks:
```python
Tool(
    name="get_weather",
    description="Get weather for a city",
    parameters=[
        ToolParameter(name="city", type="string", required=True)
    ],
    function=lambda city: f"Weather in {city}: Sunny"
)
```

### Configurations
Control agent behavior:
- `auto_save_chat_history`: Enable real-time chat saving
- `chat_history_dir`: Directory for chat files
- `max_iterations`: Maximum agent reasoning loops
- `verbose`: Show detailed output

## 📚 Usage Examples

### Example 1: Basic Agent Creation

```python
from yukta import create_agent, AgentConfig
from yukta.config import SystemPrompt
from yukta.tools import Tool, ToolProcessor, ToolParameter
from yukta.core.Clients import OllamaClient

# Create system prompt
sp = SystemPrompt("my_agent", "You are a helpful stock analysis assistant.")

# Create tools
tools = ToolProcessor()
tools.add_tool(Tool(
    name="analyze_stock",
    description="Analyze a stock",
    parameters=[
        ToolParameter(name="symbol", type="string", required=True)
    ],
    function=lambda symbol: f"Analysis for {symbol}: Growth potential 8/10"
))

# Configure agent
config = AgentConfig(
    auto_save_chat_history=True,  # Enable real-time saving
    chat_history_dir="./chats",   # Save to ./chats/AgentName/
    verbose=True
)

# Create agent
agent = create_agent(
    name="FinanceAgent",
    system_prompt=sp,
    tools_processor=tools,
    llm_client=OllamaClient(model_name="qwen2:3b"),
    config=config
)

# Use agent
response = agent.invoke("What's the outlook for AAPL stock?")
print(response)
```

### Example 2: Multi-turn Conversation

See [examples/sample.py](examples/sample.py) for a complete example with:
- Setup and configuration
- Multi-turn conversation
- Tool integration
- Real-time chat persistence
- Chat statistics

```python
# Multiple questions in sequence
questions = [
    "What will be the price of AAPL stock tomorrow?",
    "Please analyze the stock price for GOOGL",
    "Should I invest in tech stocks?"
]

for question in questions:
    response = agent.invoke(question)
    # Chat auto-saves after each message!
```

### Example 3: Using Different LLM Clients

```python
# Ollama
from yukta.core.Clients import OllamaClient
llm = OllamaClient(model_name="qwen2:3b")

# vLLM
from yukta.core.Clients import VLLMClient
llm = VLLMClient(model_name="mistral", base_url="http://localhost:8000")

# LM Studio
from yukta.core.Clients import LMStudioClient
llm = LMStudioClient(model_name="google/gemma-2b")

# Remote/OpenAI-compatible
from yukta.core.Clients import RemoteEndpointClient
llm = RemoteEndpointClient(base_url="http://localhost:8000")

# HuggingFace
from yukta.core.Clients import HuggingFaceClient
llm = HuggingFaceClient(model_name="meta-llama/Llama-2-7b", hf_token="...")
```

## 💾 Chat Persistence

### How It Works

1. **First Message**: User sends message → Saved to `./chats/{agent_name}/[filename].json`
2. **Agent Response**: LLM generates response → Immediately saved
3. **Tool Calls**: If agent calls tools → Tool calls saved
4. **Tool Results**: Tool results returned → Immediately saved
5. **Next Messages**: Conversation continues, each message auto-saved

### File Structure

```
./chats/
├── FinanceAgent/
│   ├── what_will_be_the_price_of_aapl_20260316_115708.json
│   ├── please_analyze_the_stock_20260316_120934.json
│   └── should_i_invest_in_tech_20260316_121502.json
│
└── TestAgent1/
    └── what_will_be_the_price_of_aapl_20260316_115708.json
```

### Chat File Format

```json
{
  "chat_id": "agent-uuid",
  "created_at": "2026-03-16T11:30:01.074121",
  "updated_at": "2026-03-16T11:31:16.291127",
  "metadata": {
    "agent_name": "TestAgent1"
  },
  "system_prompt": {
    "role": "system",
    "content": "Create an agent that can analyze stock data..."
  },
  "messages": [
    {
      "role": "user",
      "content": "What will be the price of AAPL stock tomorrow?",
      "timestamp": "2026-03-16T11:30:01.076469"
    },
    {
      "role": "agent",
      "content": "I'll analyze AAPL stock for you...",
      "timestamp": "2026-03-16T11:30:29.375199"
    },
    ...
  ],
  "stats": {
    "total_messages": 10,
    "user_messages": 3,
    "agent_messages": 5,
    "tool_calls": 2,
    "total_tokens": 487
  }
}
```

### Configuration

Enable/disable auto-save in `AgentConfig`:

```python
config = AgentConfig(
    auto_save_chat_history=True,      # Enable (default: True)
    chat_history_dir="./chats",       # Location (default: ./chats)
    auto_save_chat=False,             # Disable old UUID method (default: False)
)
```

## 📁 Project Structure

```
yukta/                                          # Main package
├── __init__.py                                 # Package exports
├── config/
│   ├── __init__.py
│   ├── agent_config.py                        # Agent configuration (NEW: chat_history_dir, auto_save_chat_history)
│   ├── config.py                              # Project configuration
│   ├── memory_config.py                       # Memory configuration
│   └── system_prompt.py                       # System prompt templates
├── core/
│   ├── __init__.py
│   ├── memory.py                              # Memory management with KV cache
│   ├── storage.py                             # Chat storage backends
│   ├── Agent/
│   │   ├── __init__.py
│   │   ├── agent.py                           # Core Agent (NEW: _auto_save_chat_if_enabled())
│   │   └── agent_builder.py                   # Agent builder pattern
│   ├── Chat/
│   │   ├── __init__.py
│   │   ├── chat.py                            # Chat management (NEW: generate_filename_from_first_message())
│   │   ├── message.py                         # Message types and roles
│   │   └── llm_response.py                    # LLM response handling
│   ├── Clients/
│   │   ├── __init__.py
│   │   ├── base_client.py                     # Base LLM client interface
│   │   ├── ollama_client.py                   # Ollama backend
│   │   ├── vllm_client.py                     # vLLM backend
│   │   ├── lmstudio_client.py                 # LM Studio backend
│   │   ├── remote_client.py                   # Remote/OpenAI-compatible
│   │   ├── hf_client.py                       # HuggingFace backend
│   │   ├── sglang_client.py                   # SGLang backend
│   │   └── llmclientfactory.py                # Client factory and imports
│   └── instrumentation/
│       ├── __init__.py
│       ├── decorators.py                      # Instrumentation decorators
│       ├── extractors.py                      # Data extractors
│       ├── tracer.py                          # Tracing support
│       └── tracing.py                         # Tracing utilities
├── tools/
│   ├── __init__.py
│   ├── tool.py                                # Tool definitions and parameters
│   ├── tools_pro.py                           # Tool processing and formatting
│   ├── mcp_tool.py                            # MCP tool support
│   └── utils.py                               # Tool utilities

examples/                                       # Example scripts
├── sample.py                                  # Multi-turn conversation example (UPDATED)
├── sample_2.py                                # Additional examples
├── mcp_test.py                                # MCP testing
└── remote_mcp_example.py                      # Remote MCP examples

tests/                                         # Test suite
├── __init__.py

README.md                                      # This file (UPDATED)
requirements.txt                               # Dependencies
setup.py                                       # Package setup
pyproject.toml                                 # Project configuration
MANIFEST.in                                    # Package manifest
PROJECT_STRUCTURE.md                           # Detailed structure
QUICK_REFERENCE.md                             # Quick reference guide
```

## ⚙️ Configuration

### AgentConfig

```python
from yukta import AgentConfig
import logging

config = AgentConfig(
    # LLM & Reasoning
    max_iterations=10,                 # Max agent loops
    temperature=0.7,                   # LLM temperature
    
    # Chat Persistence (NEW!)
    auto_save_chat_history=True,      # Enable real-time saving
    chat_history_dir="./chats",       # Save location
    
    # Logging
    verbose=True,                      # Show detailed output
    enable_logging=True,               # Enable agent logging
    log_level=logging.INFO,            # Log level
    
    # Memory Logging
    enable_memory_logging=True,        # Memory module logging
    memory_log_level=logging.INFO,
)
```

### System Prompt

```python
from yukta.config import SystemPrompt

sp = SystemPrompt(
    name="finance_agent",
    prompt="You are a financial analysis expert. Answer questions about stocks..."
)
```

## 📖 API Reference

### Agent Creation

```python
from yukta import create_agent, AgentConfig
from yukta.config import SystemPrompt
from yukta.tools import ToolProcessor
from yukta.core.Clients import OllamaClient

agent = create_agent(
    name="MyAgent",                      # Agent Name
    system_prompt=sp,                   # SystemPrompt instance
    tools_processor=tools,              # ToolProcessor with tools
    llm_client=llm,                     # LLM client instance
    config=config                       # AgentConfig instance
)
```

### Agent Methods

```python
# Invoke agent
response = agent.invoke(
    input="User question",
    use_llm=True,                       # Use LLM reasoning
    max_iterations=5                    # Max loops for tool calling
)

# Get chat statistics
stats = agent.get_chat_stats()
# Returns: {total_messages, user_messages, agent_messages, tool_calls, total_tokens}

# Access chat history
path = agent.save_chat_history(chat_folder="./custom_chats")  # Manual save
```

### Chat File Locations

Auto-saved chat files are located at:
```
{chat_history_dir}/{agent_name}/{generated_filename}.json
```

For example:
```
./chats/FinanceAgent/what_will_be_the_price_of_aapl_20260316_115708.json
./chats/TestAgent1/please_analyze_the_stock_20260316_120934.json
```

## 🔌 Tool Integration

### Define a Tool

```python
from yukta.tools import Tool, ToolType, ToolParameter

tool = Tool(
    name="get_weather",
    description="Get current weather for a city",
    parameters=[
        ToolParameter(
            name="city",
            type="string",
            description="City name",
            required=True
        ),
        ToolParameter(
            name="unit",
            type="string",
            description="Temperature unit (C or F)",
            required=False,
            default="C"
        )
    ],
    tool_type=ToolType.CUSTOM,
    function=lambda city, unit="C": f"Weather in {city}: 22°{unit}"
)
```

### Register with Agent

```python
from yukta.tools import ToolProcessor

tools = ToolProcessor()
tools.add_tool(tool)

agent = create_agent(
    name="WeatherAgent",
    system_prompt=sp,
    tools_processor=tools,
    llm_client=llm,
    config=config
)
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review examples in `examples/` folder

- Default URL: `http://localhost:1234`

## 🎯 Quick Start

### Example 1: Basic Agent with Ollama

```python
from yukta import create_agent, AgentConfig, SystemPrompt
from yukta.core.Clients.llmclientfactory import OllamaClient

# Create system prompt
sp = SystemPrompt(
    "yukta",
    "You are a helpful financial advisor. Provide investment advice."
)

# Create agent with Ollama
config = AgentConfig(auto_save_chat=True)
llm = OllamaClient(model_name="qwen2:3b")
agent = create_agent(
    name="FinanceAdvisor",
    system_prompt=sp,
    llm_client=llm,
    config=config
)

# Use the agent
response = agent.invoke("What's a good investment strategy for beginners?")
print(response)
```

### Example 2: Agent with Custom Tools

```python
from yukta import create_agent, AgentConfig, SystemPrompt
from yukta.tools import Tool, ToolType, ToolProcessor, ToolParameter
from yukta.core.Clients.llmclientfactory import OllamaClient

# Create system prompt
sp = SystemPrompt(
    "yukta",
    "Analyze stock data and provide investment advice."
)

# Create tool processor and add tools
tools = ToolProcessor()
tools.add_tool(
    Tool(
        name="stock_analyzer",
        description="Analyze stock data",
        parameters=[
            ToolParameter(
                name="stock_symbol",
                type="string",
                description="Stock ticker (e.g., AAPL, GOOGL)",
                required=True
            )
        ],
        tool_type=ToolType.CUSTOM,
        function=lambda stock_symbol: {
            "symbol": stock_symbol,
            "price": "$150.00",
            "trend": "bullish"
        }
    )
)

# Create agent with tools
config = AgentConfig(auto_save_chat=True)
llm = OllamaClient(model_name="qwen2:3b")
agent = create_agent(
    name="StockAgent",
    system_prompt=sp,
    tools_processor=tools,
    llm_client=llm,
    config=config
)

# Use agent with tools
response = agent.invoke("What's the trend for AAPL?")
print(response)
```

### Example 3: Multiple LLM Backends

```python
from yukta import create_agent, AgentConfig, SystemPrompt
from yukta.core.Clients.llmclientfactory import (
    OllamaClient, 
    VLLMClient,
    LMStudioClient,
    RemoteEndpointClient
)

sp = SystemPrompt("yukta", "Helpful AI assistant")
config = AgentConfig(auto_save_chat=True)

# Using Ollama
ollama_llm = OllamaClient(model_name="qwen2:3b")
agent1 = create_agent("OllamaAgent", system_prompt=sp, llm_client=ollama_llm, config=config)

# Using vLLM
vllm_llm = VLLMClient(model_name="mistral", base_url="http://localhost:8000")
agent2 = create_agent("vLLMAgent", system_prompt=sp, llm_client=vllm_llm, config=config)

# Using LM Studio
lmstudio_llm = LMStudioClient(model_name="google/gemma-2b")
agent3 = create_agent("LMStudioAgent", system_prompt=sp, llm_client=lmstudio_llm, config=config)

# Using Remote Endpoint (OpenAI-compatible)
remote_llm = RemoteEndpointClient(
    model_name="gpt-4",
    base_url="http://api.example.com/v1"
)
agent4 = create_agent("RemoteAgent", system_prompt=sp, llm_client=remote_llm, config=config)

# Use agents
print("Agent 1:", agent1.invoke("Hello!"))
print("Agent 2:", agent2.invoke("Hello!"))
print("Agent 3:", agent3.invoke("Hello!"))
print("Agent 4:", agent4.invoke("Hello!"))
```

### Example 4: Agent with Memory & Logging

```python
import logging
from repoa import create_agent, AgentConfig, SystemPrompt
from repoa.core.Clients.llmclientfactory import OllamaClient

sp = SystemPrompt("repoa", "Financial advisor")

config = AgentConfig(
    auto_save_chat=True,
    chat_save_dir="./my_chats",
    log_level=logging.INFO,
    enable_logging=True,
    memory_log_level=logging.DEBUG,
    enable_memory_logging=True,
    log_file="agent.log",
    memory_log_file="memory.log"
)

llm = OllamaClient(model_name="qwen2:3b")
agent = create_agent(
    name="LoggedAgent",
    system_prompt=sp,
    llm_client=llm,
    config=config
)

# All operations will be logged
# Chat will auto-save to ./my_chats/
response = agent.invoke("What's your advice?")
print(response)
```

### Example 5: Conversation History & Stats

```python
from yukta import create_agent, AgentConfig, SystemPrompt
from yukta.core.Clients.llmclientfactory import OllamaClient

sp = SystemPrompt("yukta", "Helpful assistant")
config = AgentConfig(auto_save_chat=True)
llm = OllamaClient(model_name="qwen2:3b")

agent = create_agent(
    name="ConversationAgent",
    system_prompt=sp,
    llm_client=llm,
    config=config
)

# Simulate multi-turn conversation
responses = []
questions = [
    "What is machine learning?",
    "What are neural networks?",
    "How do transformers work?"
]

for question in questions:
    response = agent.invoke(question)
    responses.append(response)
    print(f"Q: {question}")
    print(f"A: {response}\n")

# Get agent info
print(agent.get_agent_info())
```

### Running the Full Examples

The repository includes comprehensive examples in `examples/sample.py` showing:
1. Basic agent creation with multiple LLM backends
2. Agent with Memory integration and persistence
3. Chat indexing & session management
4. Multiple conversation sessions
5. Smart filename generation from messages

Run all examples:
```bash
python examples/sample.py
```

## ⚙️ Configuration

### AgentConfig

Main configuration class for agent behavior:

```python
config = AgentConfig(
    # Agent Behavior
    max_iterations=10,              # Max reasoning loops
    temperature=0.7,                # LLM temperature (0-2)
    verbose=False,                  # Print verbose output
    timeout=300,                    # Operation timeout (seconds)
    
    # Chat Persistence
    auto_save_chat=True,            # Auto-save after each interaction
    chat_save_dir="./chats",        # Where to save chats
    
    # Agent Logging
    log_level=logging.INFO,         # Agent log level
    enable_logging=True,            # Enable agent logging
    log_file="agent.log",           # Optional agent log file
    
    # Memory Logging
    memory_log_level=logging.DEBUG, # Memory log level
    enable_memory_logging=False,    # Enable memory logging
    memory_log_file="memory.log",   # Optional memory log file
)
```

### MemoryConfig

Configuration for Memory behavior:

```python
from yukta import MemoryConfig

config = MemoryConfig(
    max_tokens=4096,                # Max tokens before saving
    auto_save=False,                # Auto-save on overflow
    storage_backend=None,           # Custom storage backend
)
```

### SystemPrompt

Create and manage system prompts:

```python
from yukta import SystemPrompt

# Create a prompt
prompt = SystemPrompt(
    "yukta",                        # Package name
    "You are a financial advisor"   # Prompt content
)

# Get the prompt text
text = prompt.get_prompt()

# With variable substitution
prompt = SystemPrompt(
    "yukta",
    "You are a {role} assistant"
)
text = prompt.get_prompt(role="financial")
```

## 📚 Core Modules

### Agent (core/Agent/agent.py)

**Classes:**
- `Agent`: Main agent implementation
- `AgentBuilder`: Builder pattern for agent creation

**Key Methods:**
- `invoke(query)`: Execute agent with LLM and tools
- `set_memory(memory)`: Attach memory instance
- `set_llm_client(client)`: Set LLM backend
- `get_agent_info()`: Get agent metadata
- `execute_tool(name, args)`: Direct tool execution

**Features:**
- Multi-LLM support
- Tool integration
- Memory attachment
- Automatic tool calling
- Response formatting

### Memory (core/memory.py)

**Classes:**
- `Memory`: Conversation and configuration storage
- `MemoryConfig`: Memory behavior configuration

**Key Methods:**
- `add_user_message(content)`: Add user message
- `add_agent_message(content)`: Add agent message
- `add_tool_message(content, tool_id)`: Add tool result
- `get_messages()`: Retrieve all messages
- `save()`: Persist session to disk
- `get_stats()`: Get conversation statistics

**Features:**
- Automatic chat persistence
- Session management
- Message history tracking
- Configuration storage
- Multi-turn conversation support

### Tools (tools/tools_pro.py)

**Classes:**
- `Tool`: Tool definition and execution
- `ToolParameter`: Parameter specification
- `ToolProcessor`: Tool registry and management
- `ToolType`: Enumeration of tool types

**Key Methods:**
- `add_tool(tool)`: Register a tool
- `execute_tool(name, args)`: Execute tool
- `get_tool_schemas()`: Get schemas for LLM

**Features:**
- Custom tool support
- Parameter validation
- Uniform tool execution interface
- LLM schema generation
- Tool grouping and organization

### LLM Clients (core/Clients/)

**Supported Clients:**
- `OllamaClient`: Local Ollama models
- `VLLMClient`: High-performance vLLM server
- `LMStudioClient`: LM Studio GUI interface
- `RemoteEndpointClient`: OpenAI-compatible APIs
- `HuggingFaceClient`: HuggingFace Inference API
- `SGLangClient`: SGLang structured generation
- `LLMClientFactory`: Client factory for creation

**Features:**
- Streaming support
- Tool calling
- Custom parameters
- Error handling
- Auto-detection of client type

### Chat Management (core/Chat/chat.py)

**Classes:**
- `Chat`: Single chat session
- `ChatManager`: Multi-chat management

**Key Methods:**
- `add_user_message(content)`: Add message from user
- `add_agent_message(content)`: Add message from agent
- `get_messages()`: Retrieve conversation
- `get_stats()`: Get session statistics
- `save()`: Persist to disk
- `export_text()`: Export as readable text

**Features:**
- Message type handling
- Token counting
- Session metadata
- File persistence
- Text export

## 🤝 Contributing

We welcome contributions! To get started:

1. **Report Issues**: Found a bug? Create an issue with details
2. **Feature Requests**: Have an idea? Share it in the issues section
3. **Submit PRs**: Fix bugs or add features with a pull request
4. **Improve Docs**: Help improve documentation and examples

### Development Setup

```bash
# Clone repository
git clone https://github.com/VCoder4646/yukta.git
cd yukta

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install in development mode
pip install -e .
pip install -r requirements.txt

# Run tests
python -m pytest tests/
```

### Contribution Guidelines
- Follow PEP 8 style guide
- Add type hints to all functions
- Include docstrings for classes and methods
- Write tests for new features
- Update documentation
- Keep commits focused and descriptive

## 📞 Support & Community

- **Documentation**: See [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- **Issues**: Report bugs and feature requests
- **Discussions**: Ask questions and share ideas
- **Examples**: Check `examples/` for working code

## 📄 License

MIT License - See LICENSE file for details

---

## 📊 Project Status

| Component | Status | Version |
|-----------|--------|---------|
| Core Agent | ✅ Stable | 2.1.0 |
| Memory System | ✅ Stable | 2.1.0 |
| LLM Clients | ✅ Stable | 2.1.0 |
| Tool System | ✅ Stable | 2.1.0 |
| Logging | ✅ Stable | 2.1.0 |

---

**Yukta - Modular AI Agent Framework**

Made with ❤️ by the Yukta community

For the latest updates and features, visit the [GitHub repository](https://github.com/VCoder4646/yukta).

