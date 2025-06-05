import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapbox } from "../hooks/useMapbox";

const MapDisplay = () => {
  const { mapContainerRef } = useMapbox();

  return (
    <>
      <div className="flex flex-col">
        {/* Map container */}
        <div ref={mapContainerRef} className="bg-gray-300 w-full h-[500px]" />
      </div>
    </>
  );
};

export default MapDisplay;
