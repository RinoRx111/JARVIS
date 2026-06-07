from typing import List, Callable
from langchain_core.tools import BaseTool

class PluginManager:
    def __init__(self):
        self._tools: dict[str, BaseTool] = {}
        self._custom_handlers: dict[str, Callable] = {}

    def register_tool(self, tool_func: BaseTool):
        self._tools[tool_func.name] = tool_func

    def register_custom_handler(self, name: str, handler: Callable):
        self._custom_handlers[name] = handler

    def get_all_tools(self) -> List[BaseTool]:
        return list(self._tools.values())

    def get_tool(self, name: str) -> BaseTool | None:
        return self._tools.get(name)

    def get_custom_handler(self, name: str) -> Callable | None:
        return self._custom_handlers.get(name)

plugin_manager = PluginManager()
