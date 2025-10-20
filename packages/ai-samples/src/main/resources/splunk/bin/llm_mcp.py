# llmmcp.py
from splunklib.searchcommands import dispatch, StreamingCommand, Configuration, Option
import asyncio
from mcp import ClientSession
from mcp.client.sse import sse_client
import os
import sys
import certifi

os.environ["SSL_CERT_FILE"] = certifi.where()
import ollama

@Configuration()
class LLMMCPCommand(StreamingCommand):
    prompt = Option(require=True)  # SPL 中传入的 prompt
    model_name = Option(require=False, default="qwen3")  # 模型，可选

    async def call_tool(self, session: ClientSession, tool_name: str, params: dict):
        """调用 MCP 工具"""
        try:
            func = getattr(session, tool_name, None)
            if func:
                result = await func(**params)
            else:
                result = await session.call_tool(tool_name, params)

            # 转 dict 兼容输出
            if hasattr(result, "model_dump"):
                return result.model_dump()
            elif hasattr(result, "dict"):
                return result.dict()
            else:
                return result
        except Exception as e:
            return {"error": str(e)}

    async def ask_ollama(self, prompt: str, mcp_tools: list):
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
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            tools=tools
        )

        tool_calls = response['message'].get('tool_calls', [])
        return [
            tc.model_dump() if hasattr(tc, "model_dump")
            else (tc.dict() if hasattr(tc, "dict") else dict(tc))
            for tc in tool_calls
        ]

    async def run_mcp(self, prompt: str):
        MCP_SSE_URL = "http://127.0.0.1:8081/servers/splunk-remote-server/sse"
        async with sse_client(MCP_SSE_URL) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                tools_result = await session.list_tools()
                mcp_tools = tools_result.tools

                tool_calls_dicts = await self.ask_ollama(prompt, mcp_tools)
                results = []

                for first_call in tool_calls_dicts:
                    tool_name = first_call.get("name") or first_call.get("function", {}).get("name")
                    if not tool_name:
                        continue
                    params = first_call.get("arguments") or first_call.get("function", {}).get("arguments", {})
                    result = await self.call_tool(session, tool_name, params)
                    results.append(result)
                return results

    def stream(self, records):
        prompt = self.prompt
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        results = loop.run_until_complete(self.run_mcp(prompt))
        for res in results:
            yield res

if __name__ == "__main__":
    dispatch(LLMMCPCommand, sys.argv, sys.stdin, sys.stdout, __name__)
