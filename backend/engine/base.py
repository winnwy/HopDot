from typing import Protocol

from models import RouteRequest, RouteResponse


class RouteEngine(Protocol):
    async def generate(self, req: RouteRequest) -> RouteResponse: ...
