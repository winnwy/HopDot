import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapbox } from "../hooks/useMapbox";

const MapDisplay = () => {
  const [startPosition, setStartPosition] = useState<Position | null>(null);
  const [endPosition, setEndPosition] = useState<Position | null>(null);
  const [startValue, setStartValue] = useState("");
  const [endValue, setEndValue] = useState("");

  const { accessToken, mapContainerRef, mapRef, mapState } = useMapbox();

  //TODO: Instead of using string values, get the location lat, log, to set start and end position.
  const handleStartPositionSelect = (position: Position) => {
    setStartPosition(position);
  };

  const handleEndPositionSelect = (position: Position) => {
    setEndPosition(position);
  };

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
