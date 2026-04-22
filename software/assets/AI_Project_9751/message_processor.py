from yukta import Tool, ToolParameter, ToolType

def process(**kwargs):
    """
    A custom Yukta tool.
    """
    print(f"Executing tool MessageProcessor with args: {kwargs}")
    return True

def get_tool():
    """
    Returns a configured Yukta Tool instance.
    """
    params = []
    # Parameters can be defined here based on data.parameters
    
    return Tool(
        name="MessageProcessor",
        description="",
        function=process,
        parameters=params,
        tool_type=ToolType.CUSTOM
    )
