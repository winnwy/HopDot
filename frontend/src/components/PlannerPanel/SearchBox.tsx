"use client";
import { useCallback, useRef, useState, type ReactElement } from "react";
import mapboxgl from "mapbox-gl";
import { SearchBox as MapboxSearchBoxImpl } from "@mapbox/search-js-react";
import type { SearchBoxRetrieveResponse } from "@mapbox/search-js-core";
import type { LngLat } from "../../types/route.types";

// `@mapbox/search-js-react` bundles its own (older) @types/react, whose
// ForwardRefExoticComponent type is incompatible with our React 19 JSX
// typings (and it doesn't re-export its SearchBoxProps type at the package
// root). This cast presents it as a plain function component with the
// props we actually pass, to our JSX runtime — the same workaround the
// pre-M1 SearchBoxComponent.js used, ported to TS with typed props.
interface MapboxSearchBoxProps {
  accessToken: string;
  map: mapboxgl.Map;
  mapboxgl: typeof mapboxgl;
  value: string;
  onChange: (value: string) => void;
  onRetrieve: (res: SearchBoxRetrieveResponse) => void;
  placeholder?: string;
  marker?: boolean;
}
const MapboxSearchBox = MapboxSearchBoxImpl as unknown as (
  props: MapboxSearchBoxProps,
) => ReactElement;

interface SearchBoxProps {
  map: mapboxgl.Map | null;
  onAdd: (point: LngLat) => void;
}

const SearchBox = ({ map, onAdd }: SearchBoxProps) => {
  const [value, setValue] = useState("");
  const selectedCoordsRef = useRef<LngLat | null>(null);
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

  const handleRetrieve = useCallback((res: SearchBoxRetrieveResponse) => {
    const feature = res.features[0];
    if (feature) {
      const [lng, lat] = feature.geometry.coordinates;
      selectedCoordsRef.current = [lng, lat];
    }
  }, []);

  const handleAddPoint = () => {
    if (selectedCoordsRef.current) {
      onAdd(selectedCoordsRef.current);
      setValue("");
      selectedCoordsRef.current = null;
    } else {
      alert("Please select a location from the search results first.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {map && (
        <MapboxSearchBox
          accessToken={accessToken}
          map={map}
          mapboxgl={mapboxgl}
          value={value}
          onChange={(d: string) => {
            setValue(d);
            if (d === "") selectedCoordsRef.current = null;
          }}
          onRetrieve={handleRetrieve}
          placeholder="Search for a location"
          marker
        />
      )}
      <button
        onClick={handleAddPoint}
        className="shrink-0 bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-3 rounded"
      >
        Add
      </button>
    </div>
  );
};

export default SearchBox;
