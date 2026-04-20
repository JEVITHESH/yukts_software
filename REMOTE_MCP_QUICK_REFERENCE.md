# Remote MCP Tools - Quick Reference

## Quick Start

```python
from yukta.tools import create_remote_mcp_tool, ToolProcessor

# 1. Create a remote tool
tool = create_remote_mcp_tool(
    name="search",
    description="Search docs",
    endpoint="http://localhost:8080/search",
    parameters=[{"name": "query", "type": "string", "required": True}]
)

# 2. Add to processor
tools = ToolProcessor()
tools.add_tool(tool)

# 3. Execute
result = tools.execute_tool("search", {"query": "test"})
```

## With Agent

```python
from yukta.core.Agent.agent import Agent
from yukta.config.system_prompt import SystemPrompt

agent = Agent(
    agent_name="Assistant",
    system_prompt=SystemPrompt("Help with searches"),
    tools_processor=tools
)

# Agent uses tools automatically
response = agent.invoke("Search for Python tutorials")
```

## Tool Configuration

```python
# Minimal
create_remote_mcp_tool(
    name="tool",
    description="Description",
    endpoint="http://api.example.com/endpoint"
)

# Full
create_remote_mcp_tool(
    name="tool",
    description="Description",
    endpoint="http://api.example.com/endpoint",
    method="POST",      # POST|GET|PUT|PATCH
    timeout=15.0,       # seconds
    parameters=[
        {"name": "param", "type": "string", "required": True, "description": "..."}
    ]
)
```

## Execution Methods

```python
# Sync
result = tools.execute_tool("tool_name", {"arg": "value"})

# Async
result = await tools.execute_tool_async("tool_name", {"arg": "value"})

# Direct (without processor)
from yukta.tools import RemoteMCPTool
tool = RemoteMCPTool(...)
result = tool.execute({"arg": "value"})
```

## Parameter Types

```python
parameters=[
    {"name": "text", "type": "string", "required": True},
    {"name": "count", "type": "integer", "required": False, "default": 10},
    {"name": "enabled", "type": "boolean", "required": False},
    {"name": "data", "type": "object", "required": False},
    {"name": "items", "type": "array", "required": False}
]
```

## Error Handling

```python
result = tools.execute_tool("tool", args)

if "error" in result:
    print(f"Error: {result['error']}")
else:
    print(f"Success: {result}")
```

## Mixed Tools

```python
from yukta.tools import create_custom_tool

# Local tool
tools.add_tool(create_custom_tool(
    name="local",
    description="Local function",
    parameters=[...],
    function=my_function
))

# Remote tool
tools.add_tool(create_remote_mcp_tool(
    name="remote",
    description="Remote service",
    endpoint="http://...",
    parameters=[...]
))

# Both execute same way
tools.execute_tool("local", args)
tools.execute_tool("remote", args)
```

## List Tools

```python
from yukta.tools import ToolType

# All tools
all_tools = tools.list_tools()

# By type
remote = tools.list_tools(ToolType.REMOTE_MCP)
custom = tools.list_tools(ToolType.CUSTOM)

# Details
tool = tools.get_tool("tool_name")
print(tool.description)
print(tool.parameters)
```

## For LLM

```python
# Tools appear automatically in LLM schemas
schemas = tools.format_for_llm()

# Or specific tools
schemas = tools.format_for_llm(["tool1", "tool2"])
```

## Imports

```python
# Main classes
from yukta.tools import (
    RemoteMCPTool,
    create_remote_mcp_tool,
    ToolProcessor,
    Tool,
    ToolType,
    ToolParameter
)

# Direct module
from yukta.tools.mcp_tool import RemoteMCPTool, create_remote_mcp_tool
from yukta.tools.tools_pro import ToolProcessor
```

## Configuration Example

```python
# Common MCP endpoints pattern
ENDPOINTS = {
    "search": "http://mcp-server:8080/tools/search",
    "docs": "http://mcp-server:8080/tools/docs",
    "calc": "http://calc-service:9000/tools/calc"
}

def setup_tools():
    tools = ToolProcessor()
    for name, endpoint in ENDPOINTS.items():
        tool = create_remote_mcp_tool(
            name=name,
            description=f"Remote {name} tool",
            endpoint=endpoint,
            parameters=[{"name": "query", "type": "string", "required": True}]
        )
        tools.add_tool(tool)
    return tools
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Network timeout | Increase timeout: `timeout=30.0` |
| 404 Not Found | Check endpoint URL |
| Missing parameter | Verify all required params in args |
| Tool not found | Check tool name with `tools.list_tools()` |
| Connection refused | Ensure server is running |

## See Also

- Full documentation: `REMOTE_MCP_DOCUMENTATION.md`
- Examples: `examples/remote_mcp_example.py`
- API: `yukta/tools/mcp_tool.py`
