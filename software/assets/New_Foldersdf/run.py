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
# [TOOL] tool_1 Chatbot Tool
try:
    from chatbot_tool import process
    tp.add_tool(create_custom_tool(
        name="Chatbot Tool",
        description="",
        parameters=[],
        function=process
    ))
    print(f"✓ Registered tool: Chatbot Tool")
except ImportError:
    print(f"✗ Could not import tool module: chatbot_tool")

# [TOOL] node-26-nont Tool
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
        # [CONFIG] config_1 Chatbot Config
        tp.config(memory_type='buffer', logging_level='INFO')
        # [CONFIG] node-9-mqmk Config
        tp.config(memory_type='buffer', logging_level='INFO')
        # [AGENT] agent_1 Chatbot Agent
        try:
            from chatbot_agent import get_agent
            agent_agent_1 = get_agent()
            agent_agent_1.tools_processor = tp
            print(f"Agent Chatbot Agent is running...")
            agent_agent_1.run("Execute the current task in the workflow context.")
        except ImportError:
            print(f"✗ Could not import agent module: chatbot_agent")
        # [AGENT] node-17-ra86 agent
        try:
            from agent_agent import get_agent
            agent_node_17_ra86 = get_agent()
            agent_node_17_ra86.tools_processor = tp
            print(f"Agent agent is running...")
            agent_node_17_ra86.run("Execute the current task in the workflow context.")
        except ImportError:
            print(f"✗ Could not import agent module: agent_agent")
        # [HOST] host_1 Chatbot Host
        tp.host(host='0.0.0.0', port=8000)
        # [HOST] node-32-t8x1 Host
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
# [TOOL] tool_1 Chatbot Tool chatbot_tool.py
# [TOOL] node-26-nont Tool tool_tool.py