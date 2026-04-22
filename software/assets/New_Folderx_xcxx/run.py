def get_user_input():
    """Get two numbers from the user."""
    while True:
        try:
            num1 = float(input("Enter the first number: "))
            num2 = float(input("Enter the second number: "))
            return num1, num2
        except ValueError:
            print("Invalid input. Please enter a number.")

def get_operation():
    """Ask the user for the operation."""
    while True:
        operation = input("Do you want to subtract or multiply? (subtract/multiply): ")
        if operation.lower() in ["subtract", "multiply"]:
            return operation.lower()
        else:
            print("Invalid input. Please enter 'subtract' or 'multiply'.")

def calculate(num1, num2, operation):
    """Perform the calculation."""
    if operation == "subtract":
        return num1 - num2
    elif operation == "multiply":
        return num1 * num2

def main():
    num1, num2 = get_user_input()
    operation = get_operation()
    result = calculate(num1, num2, operation)
    print(f"The result of {operation}ing {num1} and {num2} is: {result}")

if __name__ == "__main__":
    main()