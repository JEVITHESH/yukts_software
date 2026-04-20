# JSON & Braces in Yukta Prompts

## The Simple Rule

**Only valid Python identifiers in braces are replaced. Everything else is left alone.**

- `{variable_name}` → Gets replaced ✅
- `{123}` → Left alone (not a valid identifier)
- `{"key": "value"}` → Left alone (not a valid identifier)
- `{my_var}` → Gets replaced ✅
- `{_private}` → Gets replaced ✅

## Examples

### Example 1: JSON Output Format
```python
from yukta.config import SystemPrompt

prompt = SystemPrompt(
    "DataProcessor",
    """Convert the data to JSON format:
    {
      "status": "success",
      "result": {data_result},
      "timestamp": 0
    }
    
    Data to process: {input_data}"""
)

result = prompt.get_prompt(
    data_result='{"items": [1, 2, 3]}',
    input_data='raw data here'
)

# Output will have:
# - {"status": "success", ... } untouched (not valid identifiers)
# - {data_result} replaced with data value
# - {input_data} replaced with input value
```

### Example 2: Mixed JSON and Variables
```python
prompt = SystemPrompt(
    "Agent",
    """Schema for response:
    {
      "type": "object",
      "properties": {
        "message": {"type": "string"},
        "code": {response_code}
      }
    }
    
    User context: {context}"""
)

result = prompt.get_prompt(
    response_code='"integer"',  # This replaces {response_code}
    context="user needs help"    # This replaces {context}
)

# The JSON structure {"type": "object", "properties": {...}} stays intact
# Only {response_code} and {context} are replaced
```

### Example 3: Code Examples  
```python
prompt = SystemPrompt(
    "CodeAdvisor",
    """Review this Python pattern:
    {
        'key': value,
        'nested': {
            'inner': True
        }
    }
    
    Focus on: {focus_area}"""
)

result = prompt.get_prompt(focus_area="error handling")

# The Python dict structure stays perfectly intact
# Only {focus_area} is replaced
```

## When Variables Are Replaced

Valid Python identifier patterns that ARE replaced:
```python
{variable}        ✅
{my_var}          ✅
{_var}            ✅
{var123}          ✅
{MY_CONST}        ✅
{_private_var}    ✅
```

Patterns that are NOT replaced (left as-is):
```python
{"key"}           ❌ (contains quote)
{123}             ❌ (starts with number)
{.attr}           ❌ (starts with dot)
{some-var}        ❌ (contains hyphen)
{var }            ❌ (contains space)
{}                ❌ (empty)
{ }               ❌ (only space)
{"name": value}   ❌ (multiple parts)
```

## Common Patterns

### Pattern 1: JSON Schema with Dynamic Fields
```python
prompt = SystemPrompt(
    "Agent",
    """Generate output matching:
    {
      "name": string,
      "type": {data_type},
      "required": true
    }
    
    Data type: {data_type}"""
)

result = prompt.get_prompt(data_type="object")
```

### Pattern 2: Config/Properties Format
```python
prompt = SystemPrompt(
    "Config",
    """Your application config:
    {
      "debug": true,
      "timeout": {timeout_ms},
      "retries": {max_retries}
    }
    
    Set timeout to: {timeout_ms}
    Max retries: {max_retries}"""
)

result = prompt.get_prompt(
    timeout_ms=5000,
    max_retries=3
)
```

### Pattern 3: Multiple JSON Objects
```python
prompt = SystemPrompt(
    "Agent",
    """Input schema:
    {
      "query": string,
      "filters": {input_filters}
    }
    
    Output schema:
    {
      "results": array,
      "total": {output_count}
    }
    
    Filters: {input_filters}
    Expected count: {output_count}"""
)

result = prompt.get_prompt(
    input_filters='{"active": true}',
    output_count=100
)
```

## Why This Works

The implementation uses regex with a specific pattern:
```
\{([a-zA-Z_][a-zA-Z0-9_]*)\}
```

This pattern matches:
1. `{` - Opening brace
2. `[a-zA-Z_]` - First character must be letter or underscore
3. `[a-zA-Z0-9_]*` - Following characters can be letters, numbers, or underscores
4. `}` - Closing brace

This is exactly the pattern for valid Python identifiers, which means:
- All JSON-like content (`{"key": ...}`) won't match
- All variable names (`{variable}`) will match
- You can safely write JSON without worrying about escaping

## Usage Tips

1. **Write JSON naturally** - No special escaping needed
   ```python
   prompt = SystemPrompt("Agent", '{"status": "ok", "data": {my_var}}')
   ```

2. **Use descriptive variable names** - Makes prompts readable
   ```python
   prompt.get_prompt(
       user_input="...",
       system_context="...",
       response_format="...",
       # NOT: get_prompt(a="...", b="...", c="...")
   )
   ```

3. **Validate JSON separately** if needed
   ```python
   import json
   schema = {"type": "object", ...}
   json.dumps(schema)  # Ensure it's valid
   
   prompt = SystemPrompt("Agent", str(schema))
   ```

4. **Variables can contain anything** - the value will be converted to string
   ```python
   result = prompt.get_prompt(
       count=100,           # Numbers converted to "100"
       data=[1,2,3],       # Lists converted to "[1, 2, 3]"
       obj={"a": "b"}      # Dicts converted to "{'a': 'b'}"
   )
   ```

## Troubleshooting

### Issue: Variable not being replaced
**Reason:** Variable name doesn't match identifier pattern

```python
# ❌ Wrong - hyphen makes it invalid
prompt.get_prompt(**{"user-name": "Alice"})  # {user-name} won't be replaced

# ✅ Right - use underscore
prompt.get_prompt(user_name="Alice")  # {user_name} will be replaced
```

### Issue: JSON appears in output twice
**Reason:** The JSON string contains valid identifiers that match variable names

```python
# If you have both:
prompt = SystemPrompt("Agent", 'Schema: {schema}\n{schema}')
result = prompt.get_prompt(schema='{"key": "value"}')

# The {schema} placeholders will be replaced twice
# This is correct behavior - if you don't want replacement, use a different name
```

### Issue: Special characters in variable values
**Solution:** They're fine - values are converted to strings

```python
result = prompt.get_prompt(
    code='{"a": 1}',    # Value with braces is OK
    message='$100/week'  # Value with special chars is OK
)
```

## Best Practices

1. **Keep JSON readable** in source code using proper formatting
2. **Use `variable_names` not `variableNames`** for consistency
3. **Document required variables** in comments above SystemPrompt creation
4. **Test with sample data** early to ensure variables are being replaced
5. **Use json module** to validate if you're building JSON dynamically

```python
import json
from yukta.config import SystemPrompt

# Document what this expects
prompt = SystemPrompt(
    "Analyzer",
    """Analyze the data provided:
    {input_data}
    
    Return JSON format:
    {
      "analysis": string,
      "confidence": 0-100,
      "details": {analysis_details}
    }"""
)
# Required: input_data (raw data to analyze), analysis_details (what to include)

# Use it with valid data
result = prompt.get_prompt(
    input_data="user input here",
    analysis_details="errors and warnings"
)
```

That's it! The system handles JSON gracefully out of the box. No escaping, no special rules - just write natural JSON and use `{variable_name}` for dynamic parts.

