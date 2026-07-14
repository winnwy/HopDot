import os
import httpx

ORS_URL = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson"

class OrsError(Exception):
    def __init__(self, status: int, detail: str):
        self.status = status
        super().__init__(f"ORS {status}: {detail}")

class OrsClient:
    def __init__(self, api_key: str | None = None):
        self._key = api_key or os.environ["ORS_API_KEY"]
        self._http = httpx.AsyncClient(timeout=12.0)

    async def _post(self, body: dict) -> dict:
        r = await self._http.post(
            ORS_URL, json=body,
            headers={"Authorization": self._key},
        )
        if r.status_code != 200:
            raise OrsError(r.status_code, r.text[:300])
        feat = r.json()["features"][0]
        return {
            "coords": feat["geometry"]["coordinates"],          # [[lng,lat],...]
            "meters": feat["properties"]["summary"]["distance"],
            "segments": [s["distance"] for s in feat["properties"].get("segments", [])],
        }

    async def directions(self, coordinates: list[list[float]]) -> dict:
        return await self._post({"coordinates": coordinates})

    async def round_trip(self, anchor: list[float], length_m: float, seed: int) -> dict:
        return await self._post({
            "coordinates": [anchor],
            "options": {"round_trip": {
                "length": max(200, round(length_m)), "points": 4, "seed": seed,
            }},
        })

    async def aclose(self):
        await self._http.aclose()
