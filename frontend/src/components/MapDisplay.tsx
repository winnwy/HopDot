import { useEffect, useRef, useState } from "react";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapbox } from "../hooks/useMapbox";
import CoordinatesDisplay from "./CoordinatesDisplay";
import SearchBoxComponent from "./SearchBoxComponent";
import mapboxgl from "mapbox-gl";
import { LngLat } from "../types/map.types";

const MapDisplay = () => {
  const [points, setPoints] = useState<LngLat[]>([]);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  const [routeId, setRouteId] = useState<string | null>(null);
  const [showRoute, setShowRoute] = useState(false);

  const [searchValue, setSearchValue] = useState("");
  const selectedCoordsRef = useRef<LngLat | null>(null);

  const { accessToken, mapContainerRef, mapRef, mapState } = useMapbox();

  const handleMapClick = async (e: mapboxgl.MapMouseEvent) => {
    const newPoint: LngLat = [e.lngLat.lng, e.lngLat.lat];
    setPoints((currentPoints) => [...currentPoints, newPoint]);
  };

  const handleAddPoint = () => {
    if (selectedCoordsRef.current) {
      setPoints((currentPoints) => [
        ...currentPoints,
        selectedCoordsRef.current!,
      ]);
      setSearchValue("");
      selectedCoordsRef.current = null;
    } else {
      alert("Please select a location from the search results first.");
    }
  };

  const handleClear = () => {
    setPoints([]);
    setSearchValue("");
    setShowRoute(false);
  };

  const handleGenerateRoute = () => {
    setShowRoute(true);
  };

  useEffect(() => {
    if (!mapRef) return;
    // Remove previous route if exists
    if (routeId && mapRef.getSource(routeId)) {
      mapRef.removeLayer(routeId);
      mapRef.removeSource(routeId);
    }
    if (showRoute && points.length >= 2) {
      const id = `route-${Date.now()}`;
      setRouteId(id);
      mapRef.addSource(id, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: points,
          },
          properties: {},
        },
      });
      mapRef.addLayer({
        id,
        type: "line",
        source: id,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#f59e42", "line-width": 4 },
      });
    }
    // Remove route if points are cleared or showRoute is false
    if (
      (!showRoute || points.length < 2) &&
      routeId &&
      mapRef.getSource(routeId)
    ) {
      mapRef.removeLayer(routeId);
      mapRef.removeSource(routeId);
      setRouteId(null);
    }
  }, [showRoute, points, mapRef]);

  useEffect(() => {
    if (!mapRef) return;
    mapRef.on("click", handleMapClick);
    return () => {
      mapRef.off("click", handleMapClick);
    };
  }, [mapRef]);

  useEffect(() => {
    markers.forEach((marker) => marker.remove());
    const newMarkers = points.map((point, index) => {
      let color = "#3498db";
      if (index === 0) {
        color = "#2ecc71";
      }
      if (index === points.length - 1 && points.length > 1) {
        color = "#e74c3c";
      }

      // Debug: Log the coordinates and check if they are within the map bounds
      if (mapRef && mapRef.getBounds) {
        const bounds = mapRef.getBounds();
        const inBounds = bounds
          ? bounds.contains(point as [number, number])
          : false;
        console.log(
          `Marker #${index}:`,
          point,
          `(lng, lat)`,
          `In map bounds:`,
          inBounds
        );
      } else {
        console.log(`Marker #${index}:`, point, "(lng, lat)");
      }

      return mapRef
        ? new mapboxgl.Marker({ color, scale: 0.8 })
            .setLngLat(point)
            .addTo(mapRef)
        : null;
    });
    setMarkers(newMarkers.filter((m): m is mapboxgl.Marker => m !== null));
  }, [points, mapRef, markers]);

  return (
    <>
      <div className="flex flex-col space-y-4 p-4">
        {/* Control Panel */}
        <div className="bg-white p-4 rounded-md shadow-md">
          <CoordinatesDisplay mapState={mapState} points={points} />
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              {mapRef && (
                <SearchBoxComponent
                  accessToken={accessToken ?? ""}
                  map={mapRef}
                  mapboxgl={mapboxgl}
                  value={searchValue}
                  onChange={(d: string) => {
                    setSearchValue(d);
                    if (d === "") selectedCoordsRef.current = null;
                  }}
                  placeholder="Search for a location"
                  marker
                />
              )}
              <button
                onClick={handleAddPoint}
                className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded"
              >
                Add
              </button>
            </div>
            <button
              onClick={handleGenerateRoute}
              className="ml-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Generate Route
            </button>
          </div>
          <button
            onClick={handleClear}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Clear Route
          </button>
        </div>
        {/* Map container */}
        <div
          ref={mapContainerRef}
          className="bg-gray-300 w-full h-[500px] rounded-md shadow-md"
        />
      </div>
    </>
  );
};

export default MapDisplay;