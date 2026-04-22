from yukta import create_agent
from yukta.core.Clients.ollama_client import OllamaClient

agent = create_agent(
name="<USER_INPUT_NAME>",
system_prompt="<USER_INPUT_SYSTEM_PROMPT>",
llm_client=OllamaClient(model_name="qwen:4b")
)

response = agent.invoke("What is Python?", use_llm=True)
print(response)
