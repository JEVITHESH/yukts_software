# [FILE: run.py]
from yukta import ToolProcessor, create_custom_tool, setup_logging

# Initialize the ToolProcessor
tp = ToolProcessor()

# [AGENT] agent_1 Calculator calculator.py
try:
    from calculator import get_agent
    calculator = get_agent()
    calculator.run("Get User Input")
except Exception as e:
    print(f"Error: {e}")

# [TOOL] tool_1 UserInputTool user_input_tool.py
try:
    from user_input_tool import create_user_input_tool
    tp.add_tool(create_user_input_tool())
except Exception as e:
    print(f"Error: {e}")

# [CONFIG] config_1 CalculatorConfig calculator_config.py
try:
    from calculator_config import get_config
    tp.config(get_config())
except Exception as e:
    print(f"Error: {e}")

# [HOST] host_1 LocalHost local_host.py
try:
    from local_host import get_host
    tp.host(get_host())
except Exception as e:
    print(f"Error: {e}")


# [FILE: calculator.py]
from yukta import YuktaFrameworkAgent

def get_agent():
    class Calculator(YuktaFrameworkAgent):
        def __init__(self):
            super().__init__(name="Calculator")

        def run(self, input_str):
            print("Calculator is running...")
            self.get_user_input()

        def get_user_input(self):
            num1 = float(input("Enter the first number: "))
            operator = input("Enter the operator (+, -, *, /): ")
            num2 = float(input("Enter the second number: "))

            if operator == "+":
                print(f"{num1} + {num2} = {num1 + num2}")
            elif operator == "-":
                print(f"{num1} - {num2} = {num1 - num2}")
            elif operator == "*":
                print(f"{num1} * {num2} = {num1 * num2}")
            elif operator == "/":
                if num2 != 0:
                    print(f"{num1} / {num2} = {num1 / num2}")
                else:
                    print("Error: Division by zero is not allowed.")
            else:
                print("Error: Invalid operator.")

    return Calculator()


# [FILE: user_input_tool.py]
from yukta import create_custom_tool

def create_user_input_tool():
    class UserInputTool:
        def __init__(self):
            self.name = "UserInputTool"

        def get_user_input(self):
            return input("Enter your input: ")

    return create_custom_tool(UserInputTool())


# [FILE: calculator_config.py]
def get_config():
    class CalculatorConfig:
        def __init__(self):
            self.precision = 2

    return CalculatorConfig()


# [FILE: local_host.py]
def get_host():
    class LocalHost:
        def __init__(self):
            self.host = "localhost"
            self.port = 8080

    return LocalHost()