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
# [TOOL] node-1776879935398 new_tool
try:
    from yukta_tool_5398 import process
    tp.add_tool(create_custom_tool(
        name="new_tool",
        description="A tool that performs a specific action.",
        parameters=[],
        function=process
    ))
    print(f"✓ Registered tool: new_tool")
except ImportError:
    print(f"✗ Could not import tool module: yukta_tool_5398")


if __name__ == '__main__':
    try:
        print('=== Yukta Workflow Execution ===')
        # [AGENT] node-1776879899198 Yukta Agent
        try:
            from yukta_agent_9198 import get_agent
            agent_node_1776879899198 = get_agent()
            agent_node_1776879899198.tools_processor = tp
            print(f"Agent Yukta Agent is running...")
            agent_node_1776879899198.run("Execute the current task in the workflow context.")
        except ImportError:
            print(f"✗ Could not import agent module: yukta_agent_9198")
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
# [TOOL] node-1776879935398 new_tool yukta_tool_5398.py