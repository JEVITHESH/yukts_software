from yukta import AgentBuilder, SystemPrompt, AgentConfig
import logging

def get_agent():
    """
    Creates and returns a Yukta Agent instance.
    The ToolProcessor will be linked automatically in the orchestrator.
    """
    config = AgentConfig(
        log_level=logging.INFO,
        verbose=False,
        auto_save_chat=False
    )
    
    # Use AgentBuilder for structured creation
    agent = AgentBuilder()\
        .with_name("Yukta Agent")\
        .with_system_prompt(SystemPrompt("default", "You are a helpful assistant."))\
        .with_config(config)\
        .build()
        
    return agent

if __name__ == "__main__":
    # Test execution
    agent = get_agent()
    print(f"Agent {agent.agent_name} initialized and ready.")
