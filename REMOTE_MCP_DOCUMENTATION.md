# Remote MCP Tool Support in Yukta

## Overview

Yukta now supports **Remote MCP (Model Context Protocol) Tools** - tools hosted on remote HTTP/REST endpoints that can be seamlessly integrated and executed by Yukta agents.

Remote MCP tools behave identically to local tools from the agent's perspective, allowing agents to transparently call remote services when needed.

## Key Features

✅ **Unified Tool Interface** - Remote MCP tools work alongside custom and builtin tools  
✅ **Transparent Execution** - Agents automatically call remote tools through the same interface  
✅ **Error Handling** - Network failures and timeouts are handled gracefully  
✅ **Type Safety** - Full type hints and validation  
✅ **Async Support** - Both sync and async execution available  
✅ **LLM Integration** - Tools appear in LLM tool schemas automatically  

## Implementation Details

### 1. New Tool Type

```python
from yukta.tools import ToolType

# ToolType enum now includes:
ToolType.REMOTE_MCP  # HTTP/REST based remote tools
ToolType.CUSTOM      # Local custom functions
ToolType.BUILTIN     # Built-in tools
ToolType.MCP         # Legacy MCP via SSE (still supported)
```

### 2. RemoteMCPTool Class

Located in `yukta/tools/mcp_tool.py`:

```python
from yukta.tools import RemoteMCPTool, ToolParameter

tool = RemoteMCPTool(
    name="search_docs",
    description="Search documentation",
    parameters=[
        ToolParameter(
            name="query",
            type="string",
            description="Search query",
            required=True
        )
    ],
    endpoint="http://localhost:8080/mcp/tools/search",
    method="POST",      # POST, GET, PUT, PATCH (default: POST)
    timeout=15.0        # Timeout in seconds (default: 15.0)
)
```

### 3. ToolProcessor Extensions

The `ToolProcessor` now includes `execute_tool()` method to uniformly execute all tool types:

```python
from repoa.tools import ToolProcessor

tools = ToolProcessor()
tools.add_tool(remote_tool)

# Execute any tool type with same interface
result = tools.execute_tool(
    tool_name="search_docs",
    args={"query": "memory caching"}
)
```

### 4. HTTP Request Format

When executing a Remote MCP tool, the request format is:

```
POST {endpoint}
Content-Type: application/json

{
  "arguments": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

The remote server should return a JSON response (dict).

## Usage Examples

### Basic Usage

```python
from repoa.tools import create_remote_mcp_tool, ToolProcessor

# Create a Remote MCP tool
search_tool = create_remote_mcp_tool(
    name="search",
    description="Search documentation",
    endpoint="http://localhost:8080/search",
    parameters=[
        {
            "name": "query",
            "type": "string",
            "description": "Search query",
            "required": True
        }
    ]
)

# Add to processor
tools = ToolProcessor()
tools.add_tool(search_tool)

# Execute
result = tools.execute_tool("search", {"query": "memory caching"})
```

### With Agent

```python
from yukta.core.Agent.agent import Agent
from yukta.config.system_prompt import SystemPrompt
from yukta.tools import ToolProcessor, create_remote_mcp_tool

# Setup tools
tools = ToolProcessor()
tools.add_tool(create_remote_mcp_tool(
    name="search",
    description="Search docs",
    endpoint="http://localhost:8080/search",
    parameters=[{"name": "query", "type": "string", "required": True}]
))

# Create agent
agent = Agent(
    agent_name="DocAgent",
    system_prompt=SystemPrompt("Search documentation efficiently"),
    tools_processor=tools
)

# Agent automatically uses tools in invoke()
response = agent.invoke("Search for memory caching")
```

### Async Execution

```python
import asyncio
from repoa.tools import ToolProcessor

async def execute_async():
    tools = ToolProcessor()
    # ... add tools ...
    
    result = await tools.execute_tool_async(
        "search",
        {"query": "async programming"}
    )
    return result

asyncio.run(execute_async())
```

### Mixed Tool Types

```python
from yukta.tools import ToolProcessor, create_custom_tool, create_remote_mcp_tool

tools = ToolProcessor()

# Local custom tool
def add(a: float, b: float):
    return {"result": a + b}

tools.add_tool(create_custom_tool(
    name="add",
    description="Add numbers",
    parameters=[
        {"name": "a", "type": "number", "required": True},
        {"name": "b", "type": "number", "required": True}
    ],
    function=add
))

# Remote MCP tool
tools.add_tool(create_remote_mcp_tool(
    name="complex_calc",
    description="Complex calculations",
    endpoint="http://localhost:9000/calc",
    parameters=[{"name": "expression", "type": "string", "required": True}]
))

# Both work through same interface
local = tools.execute_tool("add", {"a": 5, "b": 3})
remote = tools.execute_tool("complex_calc", {"expression": "(5+3)*2"})
```

## API Reference

### RemoteMCPTool

```python
class RemoteMCPTool(Tool):
    """Remote HTTP/REST-based tool"""
    
    endpoint: str          # URL endpoint
    method: str           # HTTP method (default: POST)
    timeout: float        # Timeout in seconds (default: 15.0)
    
    def execute(self, args: Dict[str, Any]) -> Dict[str, Any]
        """Execute tool synchronously"""
    
    async def execute_async(self, args: Dict[str, Any]) -> Dict[str, Any]
        """Execute tool asynchronously"""
    
    def to_dict(self) -> Dict[str, Any]
        """Convert to LLM schema format"""
```

### create_remote_mcp_tool()

```python
def create_remote_mcp_tool(
    name: str,
    description: str,
    endpoint: str,
    parameters: Optional[List[Dict[str, Any]]] = None,
    method: str = "POST",
    timeout: float = 15.0
) -> RemoteMCPTool:
    """Helper to create Remote MCP tool"""
```

### ToolProcessor Methods

```python
class ToolProcessor:
    
    def execute_tool(
        self,
        tool_name: str,
        args: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute tool synchronously"""
    
    async def execute_tool_async(
        self,
        tool_name: str,
        args: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute tool asynchronously"""
    
    def add_tool(self, tool: Tool) -> None:
        """Register a tool (any type)"""
    
    def get_tool(self, tool_name: str) -> Optional[Tool]:
        """Get tool by name"""
    
    def list_tools(self, tool_type: Optional[ToolType] = None) -> List[str]:
        """List tools, optionally filtered by type"""
    
    def format_for_llm(self, tool_names: Optional[List[str]] = None) -> List[Dict]:
        """Format tools for LLM consumption"""
```

## Error Handling

Remote MCP tools return error dictionaries for failures:

```python
# Network timeout
{"error": "Request timed out after 15.0s", "tool": "search"}

# HTTP error
{"error": "HTTP Error: ...", "status_code": 404, "tool": "search"}

# Missing parameter
{"error": "Missing required parameter: query", "tool": "search"}

# Unknown tool
{"error": "Tool 'unknown' not found"}
```

Agents can check for errors:

```python
result = tools.execute_tool("search", {"query": "test"})
if "error" in result:
    print(f"Error: {result['error']}")
else:
    print(f"Success: {result}")
```

## HTTP Methods

Remote MCP tools support multiple HTTP methods:

```python
# POST (default) - body contains arguments
create_remote_mcp_tool(..., method="POST")

# GET - query parameters
create_remote_mcp_tool(..., method="GET")

# PUT - replace resource
create_remote_mcp_tool(..., method="PUT")

# PATCH - partial update
create_remote_mcp_tool(..., method="PATCH")
```

## Timeouts and Configuration

Configure timeout per tool:

```python
tool = create_remote_mcp_tool(
    name="api_call",
    description="Call API",
    endpoint="http://api.example.com/search",
    parameters=[...],
    timeout=30.0  # 30 second timeout
)
```

## Compatibility

### Backward Compatible

- Existing CUSTOM and BUILTIN tools work unchanged
- Legacy MCP tools (SSE-based) continue to work
- Agent.invoke() flow remains unchanged

### With Agent Framework

Remote MCP tools integrate seamlessly:

- Tools appear in LLM schemas automatically
- Agents select and execute them like any other tool
- agent.invoke() handles tool execution transparently

## Implementation Details

### Architecture

```
Agent.invoke()
    ↓
LLM selects tool
    ↓
ToolProcessor.execute_tool()
    ↓
├─ CUSTOM/BUILTIN → call function()
└─ REMOTE_MCP → RemoteMCPTool.execute()
    ↓
Return result to agent
```

### Code Location

- **Tool Definition**: `yukta/tools/mcp_tool.py`
- **ToolType Enum**: `yukta/tools/tool.py`
- **Processor Integration**: `yukta/tools/tools_pro.py`
- **Exports**: `yukta/tools/__init__.py`

### Dependencies

- `httpx` - HTTP client (already in requirements)
- Standard library: `asyncio`, `dataclasses`, `enum`, `typing`

## Testing

Run the examples:

```bash
python examples/remote_mcp_example.py
```

For integration testing with actual server:

```python
from repoa.tools import create_remote_mcp_tool, ToolProcessor

# With a running MCP server on localhost:8080
tools = ToolProcessor()
tools.add_tool(create_remote_mcp_tool(
    name="test",
    description="Test endpoint",
    endpoint="http://localhost:8080/api/test",
    parameters=[{"name": "input", "type": "string", "required": True}]
))

result = tools.execute_tool("test", {"input": "hello"})
print(result)
```

## Future Enhancements

Potential improvements:

- [ ] Built-in retry logic with exponential backoff
- [ ] Request/response middleware for logging
- [ ] Authentication support (API keys, OAuth)
- [ ] Connection pooling for performance
- [ ] Tool caching with TTL
- [ ] Streaming response support

## Migration from Old MCP

If using old MCP tools via SSE:

```python
# Old way (still supported)
tools.load_mcp_tools(mcp_tools_data, host="http://localhost:8000")

# New way (recommended)
for tool_config in tools_config:
    tool = create_remote_mcp_tool(
        name=tool_config["name"],
        description=tool_config["description"],
        endpoint=tool_config["endpoint"],
        parameters=tool_config["parameters"]
    )
    tools.add_tool(tool)
```

## Troubleshooting

### Connection Timeout

```python
# Increase timeout
tool = create_remote_mcp_tool(..., timeout=30.0)
```

### Server Not Responding

Check endpoint URL and ensure server is running:

```python
# Verify endpoint
result = tools.execute_tool("tool_name", {...})
if "error" in result:
    print(f"Server error: {result['error']}")
```

### Parameter Validation

Ensure all required parameters are provided:

```python
# Check parameters
tool = tools.get_tool("search")
required = tool.get_required_params()
print(f"Required params: {required}")
```

## Examples

See `examples/remote_mcp_example.py` for 10 comprehensive examples covering:

1. Direct creation
2. Helper function usage
3. ToolProcessor setup
4. Tool execution  
5. Agent integration
6. Mixed tool types
7. Async execution
8. Error handling
9. LLM schemas
10. Setup patterns
