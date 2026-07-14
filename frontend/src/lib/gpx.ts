import type { LineString } from "geojson";

export function toGpx(geometry: LineString, name = "HopDot Route"): string {
  const trkpts = geometry.coordinates
    .map(([lng, lat]) => `      <trkpt lat="${lat}" lon="${lng}"></trkpt>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="HopDot" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${name}</name></metadata>
  <trk><name>${name}</name><trkseg>
${trkpts}
  </trkseg></trk>
</gpx>`;
}
