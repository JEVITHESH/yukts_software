from yukta import YuktaFrameworkAgent

class ChatbotAgent(YuktaFrameworkAgent):
    def __init__(self):
        super().__init__(name="Chatbot", description="A conversational AI agent.")

    def run(self, input_text):
        # Basic chatbot logic
        if input_text.lower() == "hello":
            return "Hello! How can I assist you today?"
        elif input_text.lower() == "goodbye":
            return "Goodbye! It was nice chatting with you."
        else:
            return "I didn't understand that. Please try again."

def get_agent():
    return ChatbotAgent()