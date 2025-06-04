import { SearchBox } from "@mapbox/search-js-react";
// This JS component is to avoid type assertion hacks while maintaining type safety for the rest of the code
const SearchBoxComponent = (props) => {
  return <SearchBox {...props} />;
};

export default SearchBoxComponent;