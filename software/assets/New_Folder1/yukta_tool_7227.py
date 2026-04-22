from yukta import Tool, ToolParameter, ToolType

def process(**kwargs):
    """
    A tool that performs a specific action.
    """
    print(f"Executing tool new_tool with args: {kwargs}")
    return True

def get_tool():
    """
    Returns a configured Yukta Tool instance.
    """
    params = []
    # Parameters can be defined here based on data.parameters
    
    return Tool(
        name="new_tool",
        description="A tool that performs a specific action.",
        function=process,
        parameters=params,
        tool_type=ToolType.CUSTOM
    )
