import * as GeoSearch from 'leaflet-geosearch';
import { SearchResult } from '../node_modules/leaflet-geosearch/dist/providers/provider';
import ResultList from '../node_modules/leaflet-geosearch/dist/resultList';

interface SearchControl {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	options: any; // SearchControlProps
	resultList: ResultList;
	map: L.Map;

	onSubmit(result: Selection): void | Promise<void>;
	close(): void;
	showResult(result: SearchResult, query: Selection): void;
}

async function onSubmit(query: Selection): Promise<void> {
	// @ts-expect-error  // this
	// eslint-disable-next-line @typescript-eslint/no-this-alias
	const t: SearchControl = this;

	t.resultList.clear();

	const { provider } = t.options;

	const results = await provider.search(query);

	if (results && results.length > 0) {
		t.showResult(results[0], query);
	}

	t.close();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MapSearchControl(map: L.Map, ...options: any[]) {
	// @ts-expect-error  // types
	const search: SearchControl = GeoSearch.SearchControl(...options);

	// Close search box when map clicked.
	map.on('click', search.close, search);

	// Override onSubmit to close search box after selecting result
	search.onSubmit = onSubmit.bind(search);

	return search;
}

// TODO: disable enter to search? Override/wrap selectResult
