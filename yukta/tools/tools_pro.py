"""
Tools Processing Module
Handles MCP (Model Context Protocol) tools processing and formatting.
"""

from typing import List, Dict, Any, Optional, Callable
import json
import asyncio
import sys
import httpx

# Import Tool classes from tool.py
from .tool import Tool, ToolType, ToolParameter

# MCP Client imports (for SSE support)
from mcp import ClientSession
from mcp.client.sse import sse_client

# Openinference imports
from openinference.semconv.trace import OpenInferenceSpanKindValues

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


class ToolProcessor:
    """
    Processes and manages tools for agent use.
    Handles MCP tools formatting and custom tool registration.
    """
    
    def __init__(self):
        """Initialize the tool processor."""
        self._tools: Dict[str, Tool] = {}
        self._tool_groups: Dict[str, List[str]] = {}
    
    def add_tool(self, tool: Tool) -> None:
        """
        Add a tool to the processor.
        
        Args:
            tool: Tool instance to add
        """
        self._tools[tool.name] = tool
    
    def remove_tool(self, tool_name: str) -> bool:
        """
        Remove a tool from the processor.
        
        Args:
            tool_name: Name of the tool to remove
            
        Returns:
            True if removed, False if not found
        """
        if tool_name in self._tools:
            del self._tools[tool_name]
            return True
        return False
    
    def get_tool(self, tool_name: str) -> Optional[Tool]:
        """
        Get a tool by name.
        
        Args:
            tool_name: Name of the tool
            
        Returns:
            Tool instance or None if not found
        """
        return self._tools.get(tool_name)
    
    def list_tools(self, tool_type: Optional[ToolType] = None) -> List[str]:
        """
        List all available tools, optionally filtered by type.
        
        Args:
            tool_type: Optional filter by tool type
            
        Returns:
            List of tool names
        """
        if tool_type is None:
            return list(self._tools.keys())
        return [
            name for name, tool in self._tools.items() 
            if tool.tool_type == tool_type
        ]
    
    def create_tool_group(self, group_name: str, tool_names: List[str]) -> None:
        """
        Create a named group of tools.
        
        Args:
            group_name: Name for the tool group
            tool_names: List of tool names to include
        """
        self._tool_groups[group_name] = tool_names
    
    def get_tool_group(self, group_name: str) -> List[Tool]:
        """
        Get all tools in a named group.
        
        Args:
            group_name: Name of the tool group
            
        Returns:
            List of Tool instances
        """
        tool_names = self._tool_groups.get(group_name, [])
        return [self._tools[name] for name in tool_names if name in self._tools]
    

    def parse_mcp_tool(self, mcp_tool_data: Dict[str, Any], host: str) -> Tool:
        """
        Parse MCP tool data into a Tool instance.
        
        Args:
            mcp_tool_data: MCP tool data in dictionary format
            host: Host URL for the MCP tool
            
        Returns:
            Tool instance
        """
        name = mcp_tool_data.get("name", "")
        description = mcp_tool_data.get("description", "")
        tool_type=ToolType.MCP
        
        # Parse parameters
        parameters = []
        input_schema = mcp_tool_data.get("inputSchema", {})
        properties = input_schema.get("properties", {})
        required = input_schema.get("required", [])
        
        for param_name, param_info in properties.items():
            param = ToolParameter(
                name=param_name,
                type=param_info.get("type", "string"),
                description=param_info.get("description", ""),
                required=param_name in required,
                default=param_info.get("default"),
                enum=param_info.get("enum")
            )
            parameters.append(param)
        
        
        return Tool(
            name=name,
            description=description,
            parameters=parameters,
            tool_type=ToolType.MCP,
            metadata={"original_schema": mcp_tool_data, "host": host,"tool_type": tool_type.value}
        )
    
    def load_mcp_tools(self, mcp_tools: List[Dict[str, Any]], host: str) -> int:
        """
        Load multiple MCP tools at once.
        
        Args:
            mcp_tools: List of MCP tool data dictionaries
            host: Host URL for the MCP tools
            
        Returns:
            Number of tools successfully loaded
        """
        count = 0
        for tool_data in mcp_tools:
            try:
                tool = self.parse_mcp_tool(tool_data, host)
                self.add_tool(tool)
                count += 1
            except Exception as e:
                print(f"Error loading tool {tool_data.get('name', 'unknown')}: {e}")
        return count
    

    def format_for_llm(self, tool_names: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Format tools for LLM consumption.
        
        Args:
            tool_names: Optional list of specific tools to format. If None, formats all.
            
        Returns:
            List of formatted tool dictionaries
        """
        if tool_names is None:
            tools_to_format = self._tools.values()
        else:
            tools_to_format = [self._tools[name] for name in tool_names if name in self._tools]
        
        return [tool.to_dict() for tool in tools_to_format]
    
    def execute_tool(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a tool by name with the given arguments.
        
        This method handles all tool types uniformly from the agent's perspective:
        - CUSTOM tools: Calls the registered function
        - BUILTIN tools: Calls the registered function
        - REMOTE_MCP tools: Calls the remote endpoint
        
        Args:
            tool_name: Name of the tool to execute
            args: Dictionary of arguments to pass to the tool
            
        Returns:
            Dictionary with tool execution result or error
        """
        tool = self.get_tool(tool_name)
        if not tool:
            return {"error": f"Tool '{tool_name}' not found"}
        
        # Validate arguments
        is_valid, error_msg = tool.validate_args(args)
        if not is_valid:
            return {"error": error_msg, "tool": tool_name}
        
        try:
            if tool.tool_type == ToolType.REMOTE_MCP:
                # Import here to avoid circular imports
                from .mcp_tool import RemoteMCPTool
                
                if isinstance(tool, RemoteMCPTool):
                    return tool.execute(args)
                else:
                    return {"error": f"Tool '{tool_name}' is marked as REMOTE_MCP but not a RemoteMCPTool instance", "tool": tool_name}
            
            elif tool.tool_type in (ToolType.CUSTOM, ToolType.BUILTIN):
                if tool.function is None:
                    return {"error": f"Tool '{tool_name}' has no function registered", "tool": tool_name}
                
                # Execute the function with unpacked arguments
                result = tool.function(**args)
                return result if isinstance(result, dict) else {"result": result}
            
            else:
                return {"error": f"Unknown tool type: {tool.tool_type}", "tool": tool_name}
        
        except Exception as e:
            return {"error": f"Tool execution failed: {type(e).__name__}: {str(e)}", "tool": tool_name}
    
    async def execute_tool_async(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a tool asynchronously by name with the given arguments.
        
        Args:
            tool_name: Name of the tool to execute
            args: Dictionary of arguments to pass to the tool
            
        Returns:
            Dictionary with tool execution result or error
        """
        tool = self.get_tool(tool_name)
        if not tool:
            return {"error": f"Tool '{tool_name}' not found"}
        
        # Validate arguments
        is_valid, error_msg = tool.validate_args(args)
        if not is_valid:
            return {"error": error_msg, "tool": tool_name}
        
        try:
            if tool.tool_type == ToolType.REMOTE_MCP:
                # Import here to avoid circular imports
                from .mcp_tool import RemoteMCPTool
                
                if isinstance(tool, RemoteMCPTool):
                    return await tool.execute_async(args)
                else:
                    return {"error": f"Tool '{tool_name}' is marked as REMOTE_MCP but not a RemoteMCPTool instance", "tool": tool_name}
            
            elif tool.tool_type in (ToolType.CUSTOM, ToolType.BUILTIN):
                if tool.function is None:
                    return {"error": f"Tool '{tool_name}' has no function registered", "tool": tool_name}
                
                # Execute the function with unpacked arguments
                # If the function is async, await it
                result = tool.function(**args)
                if asyncio.iscoroutine(result):
                    result = await result
                return result if isinstance(result, dict) else {"result": result}
            
            else:
                return {"error": f"Unknown tool type: {tool.tool_type}", "tool": tool_name}
        
        except Exception as e:
            return {"error": f"Tool execution failed: {type(e).__name__}: {str(e)}", "tool": tool_name}
    
    async def execute_mcp_tool(self, tool_name: str, server_url: str, args: dict) -> Dict[str, Any]:
        """
        Execute an MCP tool asynchronously via HTTP endpoint
        
        Args:
            tool_name: Name of the tool to execute
            server_url: URL of the MCP server (e.g., http://localhost:8000)
            args: Arguments to pass to the tool
            
        Returns:
            Dictionary with tool execution result or error
        """
        try:
            # Construct the tool endpoint URL
            tool_endpoint = f"{server_url}/tools/{tool_name}"
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                # Make HTTP POST request to the MCP server tool endpoint
                response = await client.post(
                    tool_endpoint,
                    json=args,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                return response.json()
                
        except asyncio.TimeoutError:
            return {"network_error": "Connection timed out after 15s"}
        except httpx.HTTPError as e:
            return {"network_error": f"HTTP Error: {e}"}
        except Exception as e:
            return {"network_error": f"{type(e).__name__}: {str(e)}"}
    
    def execute_mcp_tool_sync(self, tool_name: str, args: dict, use_sse: bool = False) -> Dict[str, Any]:
        """
        Execute an MCP tool synchronously (wrapper around async execution)
        
        Args:
            tool_name: Name of the tool to execute
            args: Arguments to pass to the tool
            use_sse: Whether to use SSE connection (default: False for HTTP)
            
        Returns:
            Dictionary with tool execution result or error
        """
        tool = self.get_tool(tool_name)
        if not tool:
            return {"error": f"Tool '{tool_name}' not found in registry"}
        
        tool_host = tool.metadata.get("host")
        if not tool_host:
            return {"error": f"Host URL not configured for tool '{tool_name}'"}
        
        if use_sse:
            # For SSE endpoint, append /sse to the base URL
            sse_url = f"{tool_host}/sse"
            return asyncio.run(self.execute_mcp_tool_sse(tool_name, sse_url, args))
        else:
            # For regular HTTP endpoint
            return asyncio.run(self.execute_mcp_tool(tool_name, tool_host, args))
        

    def export_tools_json(self, filepath: str, tool_names: Optional[List[str]] = None) -> None:
        """
        Export tools to a JSON file.
        
        Args:
            filepath: Path to save JSON file
            tool_names: Optional list of specific tools to export
        """
        formatted_tools = self.format_for_llm(tool_names)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(formatted_tools, f, indent=2)
    

    def import_tools_json(self, filepath: str) -> int:
        """
        Import tools from a JSON file.
        
        Args:
            filepath: Path to JSON file
            
        Returns:
            Number of tools imported
        """
        with open(filepath, 'r', encoding='utf-8') as f:
            tools_data = json.load(f)
        
        return self.load_mcp_tools(tools_data, host="", type="")  # Default host and type if not specified
    
    def get_tool_info(self) -> Dict[str, Any]:
        """
        Get information about all loaded tools.
        
        Returns:
            Dictionary with tool statistics and information
        """
        return {
            "total_tools": len(self._tools),
            "by_type": {
                tool_type.value: len(self.list_tools(tool_type))
                for tool_type in ToolType
            },
            "tool_groups": list(self._tool_groups.keys()),
            "tools": list(self._tools.keys())
        }
    
    def __len__(self) -> int:
        """Return the number of tools."""
        return len(self._tools)
    
    def __repr__(self) -> str:
        return f"ToolProcessor(tools={len(self._tools)})"


def create_custom_tool(
    name: str,
    description: str,
    parameters: List[Dict[str, Any]],
    function: Optional[Callable] = None
) -> Tool:
    """
    Helper function to create a custom tool.
    
    Args:
        name: Tool name
        description: Tool description
        parameters: List of parameter dictionaries with keys:
                   - name (str): Parameter name
                   - type (str): Parameter type (string, number, integer, boolean, object, array)
                   - description (str): Parameter description
                   - required (bool, optional): Whether parameter is required (default: False)
                   - default (Any, optional): Default value if not required
                   - enum (List[Any], optional): List of allowed values
        function: Optional function to execute when tool is called
        
    Returns:
        Tool instance
        
    Example:
        tool = create_custom_tool(
            name="calculator",
            description="Perform basic arithmetic",
            parameters=[
                {"name": "a", "type": "number", "description": "First number", "required": True},
                {"name": "b", "type": "number", "description": "Second number", "required": True}
            ],
            function=lambda a, b: {"result": a + b}
        )
    """
    tool_params = []
    for param in parameters:
        tool_params.append(ToolParameter(
            name=param["name"],
            type=param.get("type", "string"),
            description=param.get("description", ""),
            required=param.get("required", False),
            default=param.get("default"),
            enum=param.get("enum")
        ))
    
    return Tool(
        name=name,
        description=description,
        parameters=tool_params,
        tool_type=ToolType.CUSTOM,
        function=function
    )
