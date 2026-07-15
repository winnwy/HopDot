import { describe, expect, it } from "vitest";
import type { LineString } from "geojson";
import { toGpx } from "./gpx";

function parseXml(xml: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) {
    throw new Error(`XML failed to parse: ${errorNode.textContent}`);
  }
  return doc;
}

describe("toGpx", () => {
  const geometry: LineString = {
    type: "LineString",
    coordinates: [
      [151.2093, -33.8688],
      [151.2153, -33.8712],
      [151.2201, -33.865],
    ],
  };

  it("produces valid, parseable XML", () => {
    const xml = toGpx(geometry);
    expect(() => parseXml(xml)).not.toThrow();
  });

  it("produces the correct trkpt count", () => {
    const xml = toGpx(geometry);
    const doc = parseXml(xml);
    const trkpts = doc.getElementsByTagName("trkpt");
    expect(trkpts.length).toBe(geometry.coordinates.length);
  });

  it("swaps lat/lon correctly from [lng, lat] input", () => {
    const xml = toGpx(geometry);
    const doc = parseXml(xml);
    const trkpts = Array.from(doc.getElementsByTagName("trkpt"));
    geometry.coordinates.forEach(([lng, lat], i) => {
      expect(trkpts[i].getAttribute("lat")).toBe(String(lat));
      expect(trkpts[i].getAttribute("lon")).toBe(String(lng));
    });
  });

  it("does not crash on names needing escaping", () => {
    const trickyName = `HopDot <Run> & "Loop" 'Route'`;
    expect(() => toGpx(geometry, trickyName)).not.toThrow();
    const xml = toGpx(geometry, trickyName);
    expect(typeof xml).toBe("string");
    expect(xml.length).toBeGreaterThan(0);
  });

  it("handles an empty coordinate list without crashing", () => {
    const empty: LineString = { type: "LineString", coordinates: [] };
    expect(() => toGpx(empty)).not.toThrow();
    const doc = parseXml(toGpx(empty));
    expect(doc.getElementsByTagName("trkpt").length).toBe(0);
  });
});
