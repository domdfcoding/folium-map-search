import * as GeoSearch from 'leaflet-geosearch';
import { OpenStreetMapProviderOptions,
	RawResult } from '../node_modules/leaflet-geosearch/dist/providers/openStreetMapProvider';
import { RequestType, SearchResult } from '../node_modules/leaflet-geosearch/dist/providers/provider';
import createFuzzySearch from './microfuzz';

export interface SearchArgument {
	query: string;
	data: SearchResult;
}

export interface EndpointArgument {
	query: string | {
		[key: string]: string | number | boolean;
	};
	type?: RequestType | null;
}
// TODO: set map and layer (marker_cluster_nhle) object (or take from the Control) rather than using global variable

export type MapProviderOptions = {
	map: L.Map;
	layer: L.FeatureGroup | L.LayerGroup; // TODO accept MarkerCluster
} & OpenStreetMapProviderOptions;

export default class SearchProvider extends GeoSearch.OpenStreetMapProvider {
	map: L.Map;
	layer: L.FeatureGroup | L.LayerGroup;

	constructor(options: MapProviderOptions) {
		super(options);
		this.map = options.map;
		this.layer = options.layer;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	endpoint({ query, type }: EndpointArgument): string {
		const params = typeof query === 'string' ? { q: query } : query;
		params.format = 'json';
		params.bounded = '1';
		params.viewbox = '-7,49,3,55';
		params.featureType = 'settlement';

		return this.getUrl(this.searchUrl, params);
	}

	async search(options: SearchArgument): Promise<SearchResult<RawResult>[]> {
		if (options.data) {
			// If it's a leaflet marker (as opposed to a nominatim response) go to the marker directly rather than searching again
			if (options.data && options.data.raw instanceof L.Marker) {
				this.map.flyTo(options.data.raw.getLatLng(), 18, { animate: false });
				setTimeout(() => {
					options.data.raw.openPopup();
				}, 500);
				return [];
			}
			// TODO: same fly-to for nominatim responses
		}

		const url = this.endpoint({
			query: options.query,
			type: null,
		});

		const request = await fetch(url);
		const json = await request.json();
		const result = this.parse({ data: json });
		console.log('json:', json, 'result:', result);
		const fuzzySearch = createFuzzySearch(this.layer.getLayers(), {
			getText: (item: L.Marker): string[] => [item.options.title!],
		});
		fuzzySearch(options.query).forEach((item) => {
			const marker: L.Marker = item.item as L.Marker;
			const latlng = marker.getLatLng();
			result.push({
				bounds: null,
				label: marker.options.title!,
				// @ts-expect-error  // Marker doesn't have the right type
				raw: marker,
				x: latlng.lng,
				y: latlng.lat,
			});
		});
		return result;
	}
}

// TODO: dismiss search box on search or when clicking out of it
// TODO: disable enter to search
