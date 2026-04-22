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


if __name__ == '__main__':
    try:
        print('=== Yukta Workflow Execution ===')
        # [AGENT] node-37-tvne agent
        try:
            from agent_agent import get_agent
            agent_node_37_tvne = get_agent()
            agent_node_37_tvne.tools_processor = tp
            print(f"Agent agent is running...")
            agent_node_37_tvne.run("Execute the current task in the workflow context.")
        except ImportError:
            print(f"✗ Could not import agent module: agent_agent")
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