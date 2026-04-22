# [FILE: run.py]
from yukta import ToolProcessor, create_custom_tool, setup_logging
from chatbot_agent import get_agent
from chatbot_tool import create_chatbot_tool
from chatbot_brain import ChatbotBrain

# Initialize the ToolProcessor
tp = ToolProcessor()

# [CONFIG] config_1 SystemConfig config.py
# System configuration
tp.config(
    name="Chatbot System",
    description="A simple chatbot system"
)

# [HOST] host_1 LocalHost host.py
# Deployment settings
tp.host(
    name="LocalHost",
    description="Running on local machine"
)

# [AGENT] agent_1 ChatbotAgent chatbot_agent.py
# Initialize the chatbot agent
try:
    agent = get_agent()
    agent.run("Start the chatbot conversation")
except Exception as e:
    print(f"Error initializing chatbot agent: {e}")

# [TOOL] tool_1 ChatbotTool chatbot_tool.py
# Create the chatbot tool
try:
    chatbot_tool = create_chatbot_tool()
    tp.add_tool(chatbot_tool)
except Exception as e:
    print(f"Error creating chatbot tool: {e}")

# Initialize the chatbot brain
brain = ChatbotBrain()

# Run the chatbot
while True:
    user_input = input("User: ")
    response = brain.respond(user_input)
    print(f"Chatbot: {response}")

    if user_input.lower() == "quit":
        break

# [FILE: chatbot_agent.py]
from yukta import YuktaFrameworkAgent

class ChatbotAgent(YuktaFrameworkAgent):
    def __init__(self):
        super().__init__(name="ChatbotAgent")

    def run(self, message):
        print(f"Chatbot: {message}")

def get_agent():
    return ChatbotAgent()


# [FILE: chatbot_tool.py]
from yukta import create_custom_tool

def create_chatbot_tool():
    def chatbot_tool(input_message):
        return f"Chatbot response: {input_message}"

    return create_custom_tool(
        name="ChatbotTool",
        description="A simple chatbot tool",
        function=chatbot_tool
    )


# [FILE: chatbot_brain.py]
class ChatbotBrain:
    def __init__(self):
        self.conversation_flow = {
            "hello": "Hi, how are you?",
            "how are you": "I'm doing great, thanks!",
            "what is your name": "My name is Chatbot",
            "default": "I didn't understand that. Please try again."
        }

    def respond(self, user_input):
        user_input = user_input.lower()

        if user_input in self.conversation_flow:
            return self.conversation_flow[user_input]
        else:
            return self.conversation_flow["default"]


# [FILE: config.py]
# No code needed for this file


# [FILE: host.py]
# No code needed for this file