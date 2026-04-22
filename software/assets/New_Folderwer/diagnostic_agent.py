from yukta import YuktaFrameworkAgent

def get_agent():
    return YuktaFrameworkAgent(
        name="Diagnostic Agent",
        role="Error analysis and logging",
        goals=["Catch runtime errors and log them to error_report.txt using the Error Logger tool."],
        backstory="A specialized agent designed to ensure system stability by monitoring crashes."
    )
