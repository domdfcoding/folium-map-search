/*
 * MapSearchProvider
 *
 * ``leaflet-geosearch`` search provider for searching OpenStreetMap and markers on the map.
 */
//
// Copyright © 2026 Dominic Davis-Foster <dominic@davis-foster.co.uk>
//
// Adapted from https://github.com/smeijer/leaflet-geosearch
// Copyright (c) 2010-2016 Stephan Meijer
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
// OR OTHER DEALINGS IN THE SOFTWARE.
//

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

export type MapProviderOptions = {
	map: L.Map;
	layer: L.FeatureGroup | L.LayerGroup; // TODO accept MarkerCluster
} & OpenStreetMapProviderOptions;

export default class MapSearchProvider extends GeoSearch.OpenStreetMapProvider {
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
