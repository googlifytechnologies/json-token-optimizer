# AI JSON Optimizer (Reduce Tokens)

Optimize JSON for AI models by reducing token usage with intelligent TOON format conversion.

## Features

- **Smart Optimization**: Automatically chooses JSON or TOON format for maximum estimated token savings
- **Recursive Conversion**: Handles nested objects and arrays
- **Token Estimation**: Shows estimated token reduction percentage
- **In-Place Editing**: Replaces content directly in the editor
- **Clipboard Copy**: Optimized result copied to clipboard automatically
- **Minified Output**: Compact format for AI efficiency by default

## Example

### Before (JSON)
```json
{
  "users": [
    {"name": "Alice", "age": 30},
    {"name": "Bob", "age": 25}
  ]
}
```

### After (TOON)
```json
{"k":["users"],"d":[{"k":["name","age"],"d":[["Alice",30],["Bob",25]]}]}
```

**Result**: around 35% estimated token reduction

## Benefits

- Reduce AI API token usage by around 20-50%
- Faster AI responses
- Lower API costs
- Maintains data integrity

## Usage

1. Open a JSON file in VS Code
2. Select JSON text (or run on full document)
3. Run **Optimize JSON for AI** from Command Palette (`Ctrl+Shift+P`)
4. Review the token savings notification
5. Optimized output is written to editor and clipboard

## Requirements

- VS Code ^1.80.0

## Settings

- `aiOptimizer.prettyPrint`: Enable formatted output (default: `false`)

## Smart Optimization Logic

- Arrays of objects -> attempt TOON conversion
- Large objects (more than 3 keys or nested content) -> attempt TOON if beneficial
- Small/simple objects -> keep JSON
- Final decision -> choose the output with fewer estimated tokens

## TOON Format

Optimized with shorter keys:

- Objects: `{"k": ["key1", "key2"], "d": [value1, value2]}`
- Arrays: `{"k": ["key1", "key2"], "d": [[val1, val2], [val3, val4]]}`

Nested structures are supported recursively.
