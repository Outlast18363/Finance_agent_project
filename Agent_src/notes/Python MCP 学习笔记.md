# Python MCP 学习笔记



## Server Side

## Set up

```python
pip install uv #install new CPI

uv init mcp-server-demo #创建个使用uv instead of pip 的project

uv add "mcp[cli]" #add MCP SDK.

uv run mcp dev server.py # 如果是用uv init创建的uv project，需要在mcp指令前加uv run
# run mcp dev 会将mcp run 在mcp debugger里，就可以方便的调试mcp tools了。
```

如果是用uv init创建的uv project，需要在mcp指令前加uv run



在使用`run` 指令前，创建一个`server.py`，把mcp tool和resource都写在`server.py`里，like this

```python
# server.py
from mcp.server.fastmcp import FastMCP

# Create an MCP server
mcp = FastMCP("Demo")


# Add an addition tool
@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b


# Add a dynamic greeting resource
@mcp.resource("greeting://{name}")
def get_greeting(name: str) -> str:
    """Get a personalized greeting"""
    return f"Hello, {name}!"
```





## Client Side



MCP client json

```json
{
  "mcpServers": {
    "Example Server": {
      "command": "/usr/local/bin/uv",
      "args": [
        "--directory",
        "/Users/jz/Projects/mcp-demo",
        "run",
        "mcp",
        "dev",
        "server.py"
      ]
    }
  }
}

```



Template

```json
{
  // Define one or more named MCP servers
  "servers": {
    "<ServerName>": {
      // Transport type: "stdio", "sse", or "http"
      "type": "stdio",

      // The executable or command to launch
      "command": "<absolute-or-PATH-to-exec>",

      // An array of arguments passed to the command
      "args": [
        "--directory",
        "<absolute-path-to-your-project>",
        "run",
        "mcp",
        "dev",
        "name_of_server_file.py"
      ],

      // (Optional) Environment variables for the process
      "env": {
        "<ENV_VAR_NAME>": "<value-or-${input:your-input-id}>"
      }
    }
  }
}

```





MCP with LangGraph:

https://langchain-ai.github.io/langgraph/agents/mcp/#use-mcp-tools

```python
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent

client = MultiServerMCPClient(
    {
        "math": {
            "command": "python",
            # Replace with absolute path to your math_server.py file
            "args": ["/path/to/math_server.py"],
            "transport": "stdio",
        },
        "weather": {
            # Ensure your start your weather server on port 8000
            "url": "http://localhost:8000/mcp",
            "transport": "streamable_http",
        }
    }
)
tools = await client.get_tools()
agent = create_react_agent(
    "anthropic:claude-3-7-sonnet-latest",
    tools
)
math_response = await agent.ainvoke(
    {"messages": [{"role": "user", "content": "what's (3 + 5) x 12?"}]}
)
weather_response = await agent.ainvoke(
    {"messages": [{"role": "user", "content": "what is the weather in nyc?"}]}
)
```



Langgraph agent with tools example:

https://github.com/langchain-ai/react-agent/tree/main



## 术语：



