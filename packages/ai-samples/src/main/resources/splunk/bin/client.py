import asyncio
from mcp import ClientSession
from mcp.client.sse import sse_client
import ollama

# MCP SSE 地址
MCP_SSE_URL = "http://127.0.0.1:8081/servers/splunk-remote-server/sse"
MODEL_NAME = "qwen3"

async def call_tool(session: ClientSession, tool_name: str, params: dict):
    """调用 MCP 工具"""
    try:
        func = getattr(session, tool_name, None)
        if func:
            result = await func(**params)
        else:
            result = await session.call_tool(tool_name, params)

        # 转换为原生 Python 类型，兼容 JSON 输出
        if hasattr(result, "model_dump"):
            return result.model_dump()
        elif hasattr(result, "dict"):
            return result.dict()
        else:
            return result
    except Exception as e:
        return {"error": str(e)}

async def ask_ollama(prompt: str, mcp_tools: list):
    """调用 Ollama 生成 tool_calls"""
    tools = [
        {
            "type": "function",
            "function": {
                "name": t.name,
                "description": t.description or f"MCP tool {t.name}",
                "parameters": getattr(t, "parameters", {"type": "object", "properties": {}})
            }
        }
        for t in mcp_tools
    ]

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        tools=tools
    )

    tool_calls = response['message'].get('tool_calls', [])
    # 转 dict，兼容 Pydantic V2
    return [tc.model_dump() if hasattr(tc, "model_dump") else (tc.dict() if hasattr(tc, "dict") else dict(tc)) for tc in tool_calls]

async def main():
    async with sse_client(MCP_SSE_URL) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()

            # 列出 MCP 工具
            tools_result = await session.list_tools()
            mcp_tools = tools_result.tools
            print("Available MCP tools:")
            for t in mcp_tools:
                print("-", t.name)

            user_input = input("Ask Ollama: ")

            tool_calls_dicts = await ask_ollama(user_input, mcp_tools)
            print("Ollama tool_calls JSON:", tool_calls_dicts)

            if not tool_calls_dicts:
                print("Ollama did not return a tool call with a name.")
                return

            # 执行第一个工具调用
            first_call = tool_calls_dicts[0]
            tool_name = first_call.get("name") or first_call.get("function", {}).get("name")
            if not tool_name:
                print("Ollama did not return a tool call with a name.")
                return

            params = first_call.get("arguments") or first_call.get("function", {}).get("arguments", {})
            print(f"Calling tool: {tool_name}, params: {params}")
            result = await call_tool(session, tool_name, params)
            print("Tool result:", result)

if __name__ == "__main__":
    asyncio.run(main())
