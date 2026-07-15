from typing import Literal, Optional
from pydantic import BaseModel, Field, model_validator

LngLat = tuple[float, float]

class RouteRequest(BaseModel):
    start: LngLat
    waypoints: list[LngLat] = Field(default_factory=list, max_length=20)
    end: Optional[LngLat] = None
    mode: Literal["loop", "p2p"]
    target_km: float = Field(gt=0, le=50)
    tolerance: float = Field(default=0.05, gt=0, le=0.5)

    @model_validator(mode="after")
    def check_end(self):
        if self.mode == "p2p" and self.end is None:
            raise ValueError("mode 'p2p' requires 'end'")
        return self

class RouteResponse(BaseModel):
    geometry: dict                 # GeoJSON LineString
    distance_km: float
    target_km: float
    within_tolerance: bool
    iterations: int
    warnings: list[str] = Field(default_factory=list)
