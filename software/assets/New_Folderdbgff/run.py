from yukta import ToolProcessor, create_custom_tool, setup_logging
import logging
import os

# Initialize Logging
setup_logging(level='INFO')

# Initialize ToolProcessor
tp = ToolProcessor()

# --- Diagnostic Setup ---
# Register Error Logger Tool
try:
    from error_logger_tool import log_error
    tp.add_tool(create_custom_tool(
        name="Error Logger",
        description="Logs system errors to a file for AI diagnostic analysis",
        parameters=[{"name": "error_msg", "type": "string"}],
        function=log_error
    ))
except ImportError:
    pass

# Initialize Diagnostic Agent
diag_agent = None
try:
    from diagnostic_agent import get_agent
    diag_agent = get_agent()
    diag_agent.tools_processor = tp
except ImportError:
    pass

# --- Tool Registration ---
# [TOOL] tool_1 CalculatorTool
try:
    from calculator_tool import process
    tp.add_tool(create_custom_tool(
        name="CalculatorTool",
        description="",
        parameters=[],
        function=process
    ))
    print(f"✓ Registered tool: CalculatorTool")
except ImportError:
    print(f"✗ Could not import tool module: calculator_tool")

# [TOOL] node-20-q4e6 Tool
try:
    from tool_tool import process
    tp.add_tool(create_custom_tool(
        name="Tool",
        description="",
        parameters=[],
        function=process
    ))
    print(f"✓ Registered tool: Tool")
except ImportError:
    print(f"✗ Could not import tool module: tool_tool")


if __name__ == '__main__':
    try:
        print('=== Yukta Workflow Execution ===')
        # [AGENT] agent_1 Calculator
        try:
            from calculator_agent import get_agent
            agent_agent_1 = get_agent()
            agent_agent_1.tools_processor = tp
            print(f"Agent Calculator is running...")
            agent_agent_1.run("Execute the current task in the workflow context.")
        except ImportError:
            print(f"✗ Could not import agent module: calculator_agent")
        # [CONFIG] config_1 CalculatorConfig
        tp.config(memory_type='buffer', logging_level='INFO')
        # [CONFIG] node-26-azid Config
        tp.config(memory_type='buffer', logging_level='INFO')
        # [HOST] host_1 LocalHost
        tp.host(host='0.0.0.0', port=8000)
        # [HOST] node-32-ey37 Host
        tp.host(host='0.0.0.0', port=8000)
        print('=== Workflow Completed Successfully ===')
    except Exception as e:
        print(f'\n!!! CRITICAL ERROR: {str(e)}')
        if diag_agent:
            print('Triggering Diagnostic Agent...')
            diag_agent.run(f'The system crashed with error: {str(e)}. Log this error using the Error Logger tool.')
        else:
            with open('error_report.txt', 'w') as f:
                f.write(str(e))

# --- Yukta Framework Node Markers ---
# [TOOL] tool_1 CalculatorTool calculator_tool.py
# [TOOL] node-20-q4e6 Tool tool_tool.py