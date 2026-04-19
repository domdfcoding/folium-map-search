/*
 * MapSearchControl
 *
 * Leaflet control that adds a search box for searching OpenStreetMap and markers on the map.
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
import { SearchResult } from '../node_modules/leaflet-geosearch/dist/providers/provider';
import ResultList from '../node_modules/leaflet-geosearch/dist/resultList';
import SearchElement from '../node_modules/leaflet-geosearch/dist/SearchElement';
import { ARROW_DOWN_KEY, ARROW_UP_KEY, ENTER_KEY, ESCAPE_KEY, ARROW_LEFT_KEY, ARROW_RIGHT_KEY } from '../node_modules/leaflet-geosearch/src/constants';

interface SearchControl {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	options: any; // SearchControlProps
	searchElement: SearchElement;
	resultList: ResultList;
	map: L.Map;

	onSubmit(result: Selection): void | Promise<void>;
	close(): void;
	autoSearch(event: KeyboardEvent): void;
	selectResult(event: KeyboardEvent): void;
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

function selectResult(event: KeyboardEvent): void {
	if (
		[ENTER_KEY, ARROW_DOWN_KEY, ARROW_UP_KEY].indexOf(event.keyCode) === -1
	) {
		return;
	}

	// @ts-expect-error  // this
	// eslint-disable-next-line @typescript-eslint/no-this-alias
	const t: SearchControl = this;

	event.preventDefault();

	if (event.keyCode === ENTER_KEY) {
		return;
	}

	const max = t.resultList.count() - 1;
	if (max < 0) {
		return;
	}

	const { selected } = t.resultList;
	const next = event.keyCode === ARROW_DOWN_KEY ? selected + 1 : selected - 1;
	const idx = next < 0 ? max : next > max ? 0 : next;

	const item = t.resultList.select(idx);
	t.searchElement.input.value = item.label;
}


const SPECIAL_KEYS = [
	ESCAPE_KEY,
	ARROW_DOWN_KEY,
	ARROW_UP_KEY,
	ARROW_LEFT_KEY,
	ARROW_RIGHT_KEY,
  ];
  

async function autoSearch(event: KeyboardEvent) {
    if (SPECIAL_KEYS.indexOf(event.keyCode) > -1) {
      return;
    }

	// @ts-expect-error  // this
	// eslint-disable-next-line @typescript-eslint/no-this-alias
	const t: SearchControl = this;

    const query = (event.target as HTMLInputElement).value;
    const { provider } = t.options;

    if (query.length) {
      console.log(query)
      let results = await provider!.search({ query });
      results = results.slice(0, t.options.maxSuggestions);
      t.resultList.render(results, t.options.resultFormat);
    } else {
      t.resultList.clear();
    }
  }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MapSearchControl(options: object) {
	// @ts-expect-error  // types
	const search: SearchControl = GeoSearch.SearchControl(options);

	// @ts-expect-error  // object member
	if (options.closeOnSubmit) {
		// Override onSubmit to close search box after selecting result
		search.onSubmit = onSubmit.bind(search);
	}

	// @ts-expect-error  // object member
	if (options.disableEnterSearch) {
		search.selectResult = selectResult.bind(search);
		search.autoSearch = autoSearch.bind(search);
	}

	return search;
}
