import MapSearchProvider from './provider';
import MapSearchControl from './searchcontrol';
// export { MapSearchProvider, MapSearchControl };  // TODO: need better tool than sed to remove multiline exports (ast parser-emitter maybe) and not break source maps' line numbers

// @ts-expect-error  // Doesn't like setting attribute on L
L.MapSearchProvider = MapSearchProvider;

// @ts-expect-error  // Doesn't like setting attribute on L
L.MapSearchControl = MapSearchControl;
