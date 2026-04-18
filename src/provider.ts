

import * as GeoSearch from 'leaflet-geosearch';
import {EndpointArgument, SearchResult} from "../node_modules/leaflet-geosearch/dist/providers/provider"
import createFuzzySearch from './microfuzz'

export interface SearchArgument {
    query: string;
    data: SearchResult;
}

// TODO: set map and layer (marker_cluster_nhle) object (or take from the Control) rather than using global variable

export default class SearchProvider extends GeoSearch.OpenStreetMapProvider {
	endpoint({ query, type }: EndpointArgument): string {
		const params = typeof query === 'string' ? { q: query } : query;
		params.format = 'json';
		params.bounded = "1"
		params.viewbox = "-7,49,3,55"
		params.featureType = "settlement"
		
		console.log("Nominatum query params:", params)
		
		var result = this.getUrl(this.searchUrl, params)
		console.log("Search results:", result)
		return result;
	  }

	  async search(options: SearchArgument): Promise<SearchResult<any>[]>  {
		if (options.data) {
		
		// If it's a leaflet marker (as opposed to a nominatim response) go to the marker directly rather than searching again
		if (options.data && options.data.raw instanceof L.Marker){
			map.flyTo(options.data.raw.getLatLng(), 18, {animate: false});
			setTimeout(() => {options.data.raw.openPopup()}, 500);
			return []
		}
		// TODO: same fly-to for nominatim responses
		}

		const url = this.endpoint({
		  query: options.query,
		  type: null,
		});
	
		const request = await fetch(url);
		const json = await request.json();
		var result = this.parse({ data: json })
		console.log("json:", json, "result:", result)
		const fuzzySearch = createFuzzySearch(marker_cluster_nhle.getLayers(), {
			getText: (item) => [item.options.title],
		  })
		  fuzzySearch(options.query).forEach((item) => {
			var marker: L.Marker = item.item;
			var latlng = marker.getLatLng();
			result.push({
				bounds: null,
				label: marker.options.title!,
				raw: marker,
				x: latlng.lng,
				y: latlng.lat,
			})
		  })
		return result;
		
	  }
	
}

// TODO: dismiss search box on search or when clicking out of it
// TODO: disable enter to search
