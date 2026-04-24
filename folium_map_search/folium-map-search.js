const GeoSearch2=GeoSearch

// src/provider.ts
//import * as GeoSearch from "leaflet-geosearch";
//import createFuzzySearch from "../src/microfuzz/index.ts";
var MapSearchProvider = class extends GeoSearch.OpenStreetMapProvider {
  constructor(options) {
    super(options);
    this.map = options.map;
    this.layer = options.layer;
    this.viewbox = options.viewbox;
    this.featureType = options.featureType;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  endpoint({ query, type }) {
    const params = typeof query === "string" ? { q: query } : query;
    params.format = "json";
    if (this.viewbox) {
      params.bounded = "1";
      params.viewbox = this.viewbox;
    }
    if (this.featureType) {
      params.featureType = this.featureType;
    }
    return this.getUrl(this.searchUrl, params);
  }
  async search(options) {
    if (options.data) {
      if (options.data && options.data.raw instanceof L.Marker) {
        this.map.flyTo(options.data.raw.getLatLng(), 18, { animate: false });
        setTimeout(() => {
          options.data.raw.openPopup();
        }, 500);
        return [];
      } else if (options.data.raw) {
        this.map.flyTo([options.data.raw.lat, options.data.raw.lon], 14, { animate: false });
        return [];
      }
    }
    const url = this.endpoint({
      query: options.query,
      type: null
    });
    const request = await fetch(url);
    const json = await request.json();
    const result = this.parse({ data: json });
    console.log("json:", json, "result:", result);
    const fuzzySearch = createFuzzySearch(this.layer.getLayers(), {
      getText: (item) => [getSearchName(item)]
    });
    fuzzySearch(options.query).forEach((item) => {
      const marker = item.item;
      const latlng = marker.getLatLng();
      result.push({
        bounds: null,
        label: getSearchName(marker),
        // @ts-expect-error  // Marker doesn't have the right type
        raw: marker,
        x: latlng.lng,
        y: latlng.lat
      });
    });
    return result;
  }
};
function getSearchName(marker) {
  const searchName = marker.options.searchName;
  if (searchName) {
    return searchName;
  }
  return marker.options.title;
}

// src/searchcontrol.ts
//import * as GeoSearch2 from "leaflet-geosearch";

// node_modules/leaflet-geosearch/src/constants.ts
var ENTER_KEY = 13;
var ESCAPE_KEY = 27;
var ARROW_DOWN_KEY = 40;
var ARROW_UP_KEY = 38;
var ARROW_LEFT_KEY = 37;
var ARROW_RIGHT_KEY = 39;

// node_modules/leaflet-geosearch/src/domUtils.ts
function removeClassName(element, className) {
  if (!element || !element.classList) {
    return;
  }
  const classNames = Array.isArray(className) ? className : [className];
  classNames.forEach((name) => {
    if (element.classList.contains(name)) {
      element.classList.remove(name);
    }
  });
}

// src/searchcontrol.ts
async function onSubmit(query) {
  const t = this;
  t.resultList.clear();
  const { provider } = t.options;
  const results = await provider.search(query);
  if (results && results.length > 0) {
    t.showResult(results[0], query);
  }
  t.close();
}
function selectResult(event) {
  if ([ENTER_KEY, ARROW_DOWN_KEY, ARROW_UP_KEY].indexOf(event.keyCode) === -1) {
    return;
  }
  const t = this;
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
var SPECIAL_KEYS = [
  ESCAPE_KEY,
  ARROW_DOWN_KEY,
  ARROW_UP_KEY,
  ARROW_LEFT_KEY,
  ARROW_RIGHT_KEY
];
async function autoSearch(event) {
  if (SPECIAL_KEYS.indexOf(event.keyCode) > -1) {
    return;
  }
  const t = this;
  const query = event.target.value;
  const { provider } = t.options;
  if (query.length) {
    let results = await provider.search({ query });
    results = results.slice(0, t.options.maxSuggestions);
    t.resultList.render(results, t.options.resultFormat);
  } else {
    t.resultList.clear();
  }
}
function onKeyUp(_event) {
}
function clearResults(event, force = false) {
  if (event && event.keyCode !== ESCAPE_KEY) {
    return;
  }
  const t = this;
  const { keepResult, autoComplete } = t.options;
  if (t.searchElement.input.value === "") {
    removeClassName(t.searchElement.container, ["pending", "active"]);
    t.searchElement.input.value = "";
    document.body.focus();
    document.body.blur();
  } else {
    if (force || !keepResult) {
      t.searchElement.input.value = "";
      t.markers.clearLayers();
    }
    if (autoComplete) {
      t.resultList.clear();
    }
  }
}
function MapSearchControl(options) {
  const search = GeoSearch2.SearchControl(options);
  if (options.closeOnSubmit) {
    search.onSubmit = onSubmit.bind(search);
  }
  search.searchElement.onKeyUp = onKeyUp.bind(search.searchElement);
  search.clearResults = clearResults.bind(search);
  if (options.disableEnterSearch) {
    search.selectResult = selectResult.bind(search);
    search.autoSearch = autoSearch.bind(search);
  }
  search.searchElement.form.autocomplete = "off";
  return search;
}

// src/main.ts
L.MapSearchProvider = MapSearchProvider;
L.MapSearchControl = MapSearchControl;
//# sourceMappingURL=folium-map-search.js.map
