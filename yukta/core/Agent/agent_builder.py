from typing import Optional
from .agent import Agent
from ...config.agent_config import AgentConfig
from ...config.system_prompt import SystemPrompt
from ...tools.tools_pro import ToolProcessor
from ..Clients.llmclientfactory import BaseLLMClient
from ...core.memory import Memory
class AgentBuilder:
    """
    Builder class for creating agents with a fluent interface.
    """
    
    def __init__(self):
        """Initialize the agent builder."""
        self._name: Optional[str] = None
        self._system_prompt: Optional[SystemPrompt] = None
        self._tools_processor: Optional[ToolProcessor] = None
        self._config: Optional[AgentConfig] = None
        self._agent_id: Optional[str] = None
        self._llm_client: Optional['BaseLLMClient'] = None
        self._memory: Optional['Memory'] = None
        self._use_memory_cache: bool = False
    
    def with_name(self, name: str) -> 'AgentBuilder':
        """Set the agent name."""
        self._name = name
        return self
    
    def with_default_prompt(self, system_prompt: str) -> 'AgentBuilder':
        """Set the system prompt."""
        if isinstance(system_prompt, str):
            system_prompt = SystemPrompt("custom", system_prompt)
        self._system_prompt = system_prompt
        return self
    
    
    def with_tools_processor(self, tools_processor: ToolProcessor) -> 'AgentBuilder':
        """Set the tools processor."""
        self._tools_processor = tools_processor
        return self
    
    def with_config(self, config: AgentConfig) -> 'AgentBuilder':
        """Set the agent configuration."""
        self._config = config
        return self
    
    def with_id(self, agent_id: str) -> 'AgentBuilder':
        """Set a custom agent ID."""
        self._agent_id = agent_id
        return self
    
    def with_llm_client(self, llm_client: 'BaseLLMClient') -> 'AgentBuilder':
        """Set the LLM client."""
        self._llm_client = llm_client
        return self
    
    def with_memory(self, memory: 'Memory', enable_cache: bool = True) -> 'AgentBuilder':
        """Set the Memory instance with optional cache."""
        self._memory = memory
        self._use_memory_cache = enable_cache
        return self
    
    def build(self) -> Agent:
        """
        Build and return the Agent instance.
        
        Returns:
            Configured Agent instance
            
        Raises:
            ValueError: If required fields are missing
        """
        if not self._name:
            raise ValueError("Agent name is required")
        if not self._system_prompt:
            raise ValueError("System prompt is required")
        if not self._tools_processor:
            self._tools_processor = ToolProcessor()
        
        return Agent(
            agent_name=self._name,
            system_prompt=self._system_prompt,
            tools_processor=self._tools_processor,
            config=self._config,
            agent_id=self._agent_id,
            llm_client=self._llm_client,
            memory=self._memory,
            use_memory_cache=self._use_memory_cache
        )
