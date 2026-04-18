import SearchProvider from './provider';
// export { SearchProvider };  // TODO: need better tool than sed to remove multiline exports (ast parser-emitter maybe)

// @ts-expect-error  // Doesn't like setting attribute on L
L.SearchProvider = SearchProvider;
