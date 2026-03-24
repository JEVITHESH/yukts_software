# Token Analysis Usage Example for FinanceAdvisor Agent

This example demonstrates how to use the token analysis features with the FinanceAdvisor agent.

## Setup

```python
from yukta.core.Agent.agent import Agent
from yukta.config.system_prompt import SystemPrompt
from yukta.tools.tools_pro import ToolProcessor, Tool
from yukta.config.agent_config import AgentConfig
from yukta.core.Clients.llmclientfactory import OllamaClient
from yukta.core.token_analyzer import count_tokens, TokenAnalyzer

# Initialize LLM Client (with token analyzer auto-initialized)
llm_client = OllamaClient(
    model_name='neural-chat',
    base_url='http://localhost:11434'
)

# Create system prompt
system_prompt = SystemPrompt(
    prompt_name='FinanceAdvisor',
    prompt_text="""You are an expert financial advisor with deep knowledge of:
- Investment strategies
- Portfolio management
- Risk assessment
- Financial planning
- Tax optimization

Provide clear, actionable financial advice based on the user's situation."""
)

# Create tools
tools_processor = ToolProcessor()

# Define a sample tool
def calculate_monthly_payment(principal: float, annual_rate: float, years: int) -> dict:
    \"\"\"Calculate monthly mortgage payment using compound interest formula.\"\"\"
    monthly_rate = annual_rate / 100 / 12
    n_payments = years * 12
    
    if monthly_rate == 0:
        monthly_payment = principal / n_payments
    else:
        monthly_payment = principal * (monthly_rate * (1 + monthly_rate) ** n_payments) / (
            (1 + monthly_rate) ** n_payments - 1
        )
    
    total_paid = monthly_payment * n_payments
    total_interest = total_paid - principal
    
    return {
        'monthly_payment': round(monthly_payment, 2),
        'total_paid': round(total_paid, 2),
        'total_interest': round(total_interest, 2),
        'n_payments': n_payments
    }

# Add tool
mortgage_tool = Tool(
    name='calculate_mortgage',
    description='Calculate monthly mortgage payment and total interest',
    parameters=[
        {'name': 'principal', 'type': 'float', 'description': 'Loan amount in dollars'},
        {'name': 'annual_rate', 'type': 'float', 'description': 'Annual interest rate (e.g., 5.5)'},
        {'name': 'years', 'type': 'int', 'description': 'Loan term in years'},
    ],
    function=calculate_monthly_payment
)

tools_processor.add_tool(mortgage_tool)

# Create agent config with auto-save
config = AgentConfig(
    auto_save_chat=True,
    auto_save_chat_history=True,
    verbose=True,
    max_iterations=5
)

# Initialize agent (TokenAnalyzer auto-initialized with model)
agent = Agent(
    agent_name='FinanceAdvisor',
    system_prompt=system_prompt,
    tools_processor=tools_processor,
    config=config,
    llm_client=llm_client
)

print(f"Agent initialized. Token Analyzer ready: {agent.token_analyzer is not None}")
```

## Example 1: Track Single Interaction

```python
# Simple user query
response = agent.run(
    user_message="What is the monthly payment for a $300,000 mortgage at 5.5% for 30 years?"
)

# Get token usage immediately
print("\n=== Token Usage ===")
print(agent.get_token_summary())

# Get detailed analysis
analysis = agent.get_token_analysis()
print(f"\nToken Analysis:")
print(f"  Total Tokens: {analysis['total_tokens']:,}")
print(f"  Input Tokens: {analysis['input_tokens']:,}")
print(f"  Output Tokens: {analysis['output_tokens']:,}")
print(f"  LLM Calls: {analysis['llm_calls']}")

# Check costs
costs = agent.estimate_token_costs()
print(f"\nEstimated Cost: ${costs['total_cost']:.6f}")
```

## Example 2: Monitor Chat Growth

```python
# Perform multiple interactions
queries = [
    "What is the monthly payment for a $300,000 mortgage at 5.5% for 30 years?",
    "Compare this to a 15-year mortgage at 5.2%",
    "What about if I put down 20% instead of standard 10%?",
]

for i, query in enumerate(queries, 1):
    print(f"\n--- Query {i} ---")
    print(f"User: {query}")
    
    # Run agent
    response = agent.run(query)
    
    # Track growth
    chat_analysis = agent.chat.get_token_analysis()
    print(f"Chat Tokens: {chat_analysis['total_tokens']:,}")
    print(f"Context Usage: {chat_analysis['context_usage_percent']}%")
    print(f"Available: {chat_analysis['available_tokens']:,} tokens")
    
    if chat_analysis['context_usage_percent'] > 80:
        print("⚠️  WARNING: High context usage!")

# Final report
print("\n=== FINAL REPORT ===")
print(agent.get_token_report())
```

## Example 3: Export Token Analysis

```python
import json
from datetime import datetime

# Get comprehensive analysis
analysis = agent.get_token_analysis()

# Prepare report
report = {
    'timestamp': datetime.now().isoformat(),
    'agent': {
        'name': agent.agent_name,
        'id': agent.agent_id,
        'model': agent.token_analyzer.model_name if agent.token_analyzer else 'unknown'
    },
    'tokens': {
        'total': analysis['total_tokens'],
        'input': analysis['input_tokens'],
        'output': analysis['output_tokens'],
        'system': analysis['system_tokens'],
    },
    'execution': {
        'llm_calls': analysis['llm_calls'],
        'tool_calls': agent.stats['tool_calls'],
        'successful_tools': agent.stats['successful_tool_calls'],
        'failed_tools': agent.stats['failed_tool_calls'],
    },
    'costs': agent.estimate_token_costs(),
    'chat': agent.chat.get_token_analysis() if agent.chat else None,
}

# Save report
with open('finance_advisor_report.json', 'w') as f:
    json.dump(report, f, indent=2)

print("Report saved to finance_advisor_report.json")
```

## Example 4: Per-Message Analysis

```python
# Access chat and analyze messages
if agent.chat:
    print("=== MESSAGE ANALYSIS ===\n")
    
    for i, msg in enumerate(agent.chat.messages, 1):
        analysis = msg.analyze_tokens()
        print(f"Message {i} ({msg.role}):")
        print(f"  Content: {msg.content[:50]}...")
        print(f"  Content Tokens: {analysis['content_tokens']}")
        print(f"  Tool Tokens: {analysis['tool_tokens']}")
        print(f"  Total: {analysis['total_tokens']}")
        if msg.has_tool_calls():
            print(f"  Tool Calls: {len(msg.tool_calls)}")
        print()
    
    # Summary
    stats = agent.chat.get_stats()
    print(f"Summary:")
    print(f"  Total Messages: {stats['total_messages']}")
    print(f"  User Messages: {stats['user_messages']} ({stats['user_tokens']} tokens)")
    print(f"  Agent Messages: {stats['agent_messages']} ({stats['agent_tokens']} tokens)")
    print(f"  Tool Responses: {stats['tool_calls']} ({stats['tool_tokens']} tokens)")
```

## Example 5: Cost Tracking Over Multiple Sessions

```python
import csv
from datetime import datetime

# Run multiple sessions and track costs
sessions = []

for session_num in range(3):
    print(f"\n=== Session {session_num + 1} ===")
    
    # Reset for new session
    agent.reset()
    
    # Run interaction
    response = agent.run(
        f"Session {session_num + 1}: Calculate mortgage for ${300000 + session_num * 100000}"
    )
    
    # Record metrics
    costs = agent.estimate_token_costs()
    session_data = {
        'session': session_num + 1,
        'timestamp': datetime.now().isoformat(),
        'total_tokens': agent.stats['total_tokens'],
        'input_tokens': agent.stats['input_tokens'],
        'output_tokens': agent.stats['output_tokens'],
        'cost': costs['total_cost'],
        'llm_calls': agent.stats['llm_calls'],
    }
    sessions.append(session_data)
    
    print(f"Session Cost: ${costs['total_cost']:.6f}")

# Save to CSV
with open('session_costs.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=sessions[0].keys())
    writer.writeheader()
    writer.writerows(sessions)

total_cost = sum(s['cost'] for s in sessions)
print(f"\n=== TOTAL ACROSS SESSIONS ===")
print(f"Total Cost: ${total_cost:.6f}")
print(f"Average Cost per Session: ${total_cost / len(sessions):.6f}")
```

## Example 6: Context Window Monitoring

```python
# Monitor context window health
print("=== CONTEXT WINDOW MONITORING ===\n")

queries = [...]  # Multiple queries

for query in queries:
    agent.run(query)
    
    analysis = agent.chat.get_token_analysis()
    
    # Check health
    usage = analysis['context_usage_percent']
    available = analysis['available_tokens']
    
    status = "✓ Good"
    if usage > 90:
        status = "✗ Critical"
    elif usage > 80:
        status = "⚠ High"
    elif usage > 50:
        status = "○ Moderate"
    
    print(f"{status}: {usage}% used, {available:,} tokens available")
    
    # Generate warning if needed
    if usage > 85:
        print("  → Consider saving chat and starting new session")
```

## Integration with Existing Code

```python
# Your existing agent code works unchanged
agent = Agent(
    agent_name='FinanceAdvisor',
    system_prompt=system_prompt,
    tools_processor=tools_processor,
    llm_client=llm_client
)

# Token analysis automatically available
response = agent.run("your query")

# At any time, check token usage:
print(agent.get_token_summary())
print(agent.get_token_report())
print(agent.estimate_token_costs())
```

## Key Methods Summary

### Agent Methods
```python
agent.get_token_analysis()      # Comprehensive dict
agent.get_token_report()         # Formatted string report
agent.get_token_summary()        # One-liner summary
agent.estimate_token_costs()     # Cost breakdown
agent.update_token_stats(...)    # Manual update
agent.stats                      # Access raw statistics
agent.token_analyzer             # TokenAnalyzer instance
```

### Chat Methods
```python
agent.chat.get_token_analysis()  # Chat-specific analysis
agent.chat.get_token_report()    # Chat report
agent.chat.get_token_count()     # Quick total
agent.chat.stats                 # Raw statistics
```

### Message Methods
```python
msg.token_count                  # Token count property
msg.analyze_tokens()             # Detailed breakdown
```

## Best Practices

1. **Check context before long conversations**:
   ```python
   if agent.chat.get_token_analysis()['context_usage_percent'] > 80:
       # Save and reset chat
   ```

2. **Track costs regularly**:
   ```python
   costs = agent.estimate_token_costs()
   print(f"Current cost: ${costs['total_cost']:.6f}")
   ```

3. **Analyze on completion**:
   ```python
   response = agent.run(query)
   print(agent.get_token_summary())
   ```

4. **Export reports**:
   ```python
   with open('report.txt', 'w') as f:
       f.write(agent.get_token_report())
   ```

## Output Examples

```
Agent 'FinanceAdvisor' - Total Tokens: 1,234 (Input: 850, Output: 384, System: 50) - Cost: $0.001234

========== AGENT TOKEN ANALYSIS REPORT ==========
Agent: FinanceAdvisor (a1b2c3d4...)
Model: neural-chat (cl100k_base)

Token Usage Summary:
  Total Tokens: 1,234
  Input Tokens: 850 (68.9%)
  Output Tokens: 384 (31.1%)
  System Tokens: 50 (0.0%)

Execution Statistics:
  LLM Calls: 3
  Avg Tokens/Call: 411.3
  Estimated Cost: $0.001234

Tool Execution:
  Total Tool Calls: 1
  Successful: 1
  Failed: 0
```

---

This approach provides complete visibility into:
- ✅ Token usage per interaction
- ✅ Context window health
- ✅ Cost tracking
- ✅ Performance metrics
- ✅ Tool effectiveness
- ✅ Message efficiency
