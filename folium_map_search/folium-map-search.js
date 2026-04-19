const GeoSearch2=GeoSearch

// src/provider.ts

// src/microfuzz/normalizeText.ts
var diacriticsRegex = /[\u0300-\u036f]/g;
var regex\u0141 = /ł/g;
var regex\u00D1 = /ñ/g;
function normalizeText(string) {
  return string.toLowerCase().normalize("NFD").replace(diacriticsRegex, "").replace(regex\u0141, "l").replace(regex\u00D1, "n").trim();
}

// src/microfuzz/impl.ts
var { MAX_SAFE_INTEGER } = Number;
var sortByScore = (a, b) => a.score - b.score;
var sortRangeTuple = (a, b) => a[0] - b[0];
var validWordBoundaries = new Set(` \xA0[]()-\u2013\u2014'"\u201C\u201D`.split(""));
function isValidWordBoundary(character) {
  return validWordBoundaries.has(character);
}
function matchesFuzzily(item, normalizedItem, itemWords, query, normalizedQuery, queryWords, strategy) {
  if (item === query) {
    return [0, [[0, item.length - 1]]];
  }
  const queryLen = query.length;
  const normalizedItemLen = normalizedItem.length;
  const normalizedQueryLen = normalizedQuery.length;
  if (normalizedItem === normalizedQuery) {
    return [0.1, [[0, normalizedItemLen - 1]]];
  } else if (normalizedItem.startsWith(normalizedQuery)) {
    return [0.5, [[0, normalizedQueryLen - 1]]];
  }
  const exactContainsIdx = item.indexOf(query);
  if (exactContainsIdx > -1 && isValidWordBoundary(item[exactContainsIdx - 1])) {
    return [0.9, [[exactContainsIdx, exactContainsIdx + queryLen - 1]]];
  }
  const containsIdx = normalizedItem.indexOf(normalizedQuery);
  if (containsIdx > -1 && isValidWordBoundary(normalizedItem[containsIdx - 1])) {
    return [1, [[containsIdx, containsIdx + queryLen - 1]]];
  }
  const queryWordCount = queryWords.length;
  if (queryWordCount > 1) {
    if (queryWords.every((word) => itemWords.has(word))) {
      const score = 1.5 + queryWordCount * 0.2;
      return [
        score,
        queryWords.map((word) => {
          const wordIndex = normalizedItem.indexOf(word);
          return [wordIndex, wordIndex + word.length - 1];
        }).sort(sortRangeTuple)
      ];
    }
  }
  if (containsIdx > -1) {
    return [2, [[containsIdx, containsIdx + queryLen - 1]]];
  }
  if (strategy === "aggressive") {
    return aggressiveFuzzyMatch(normalizedItem, normalizedQuery);
  } else if (strategy === "smart") {
    return experimentalSmartFuzzyMatch(normalizedItem, normalizedQuery);
  }
  return null;
}
function aggressiveFuzzyMatch(normalizedItem, normalizedQuery) {
  const normalizedItemLen = normalizedItem.length;
  const normalizedQueryLen = normalizedQuery.length;
  let queryIdx = 0;
  let queryChar = normalizedQuery[queryIdx];
  const indices = [];
  let chunkFirstIdx = -1;
  let chunkLastIdx = -2;
  for (let itemIdx = 0; itemIdx < normalizedItemLen; itemIdx += 1) {
    if (normalizedItem[itemIdx] === queryChar) {
      if (itemIdx !== chunkLastIdx + 1) {
        if (chunkFirstIdx >= 0) {
          indices.push([chunkFirstIdx, chunkLastIdx]);
        }
        chunkFirstIdx = itemIdx;
      }
      chunkLastIdx = itemIdx;
      queryIdx += 1;
      if (queryIdx === normalizedQueryLen) {
        indices.push([chunkFirstIdx, chunkLastIdx]);
        return scoreConsecutiveLetters(indices, normalizedItem);
      }
      queryChar = normalizedQuery[queryIdx];
    }
  }
  return null;
}
function experimentalSmartFuzzyMatch(normalizedItem, normalizedQuery) {
  const normalizedItemLen = normalizedItem.length;
  const indices = [];
  let queryIdx = 0;
  let queryChar = normalizedQuery[queryIdx];
  let chunkFirstIdx = -1;
  let chunkLastIdx = -2;
  while (true) {
    const idx = normalizedItem.indexOf(queryChar, chunkLastIdx + 1);
    if (idx === -1) {
      break;
    }
    if (idx === 0 || isValidWordBoundary(normalizedItem[idx - 1])) {
      chunkFirstIdx = idx;
    } else {
      const queryCharsLeft = normalizedQuery.length - queryIdx;
      const itemCharsLeft = normalizedItem.length - idx;
      const minimumChunkLen = Math.min(3, queryCharsLeft, itemCharsLeft);
      const minimumQueryChunk = normalizedQuery.slice(queryIdx, queryIdx + minimumChunkLen);
      if (normalizedItem.slice(idx, idx + minimumChunkLen) === minimumQueryChunk) {
        chunkFirstIdx = idx;
      } else {
        chunkLastIdx += 1;
        continue;
      }
    }
    for (chunkLastIdx = chunkFirstIdx; chunkLastIdx < normalizedItemLen; chunkLastIdx += 1) {
      if (normalizedItem[chunkLastIdx] !== queryChar) {
        break;
      }
      queryIdx += 1;
      queryChar = normalizedQuery[queryIdx];
    }
    chunkLastIdx -= 1;
    indices.push([chunkFirstIdx, chunkLastIdx]);
    if (queryIdx === normalizedQuery.length) {
      return scoreConsecutiveLetters(indices, normalizedItem);
    }
  }
  return null;
}
function scoreConsecutiveLetters(indices, normalizedItem) {
  let score = 2;
  indices.forEach(([firstIdx, lastIdx]) => {
    const chunkLength = lastIdx - firstIdx + 1;
    const isStartOfWord = firstIdx === 0 || normalizedItem[firstIdx] === " " || normalizedItem[firstIdx - 1] === " ";
    const isEndOfWord = lastIdx === normalizedItem.length - 1 || normalizedItem[lastIdx] === " " || normalizedItem[lastIdx + 1] === " ";
    const isFullWord = isStartOfWord && isEndOfWord;
    if (isFullWord) {
      score += 0.2;
    } else if (isStartOfWord) {
      score += 0.4;
    } else if (chunkLength >= 3) {
      score += 0.8;
    } else {
      score += 1.6;
    }
  });
  return [score, indices];
}
function createFuzzySearchImpl(collection, options) {
  const { strategy = "aggressive", getText } = options;
  let text;
  const preprocessedCollection = collection.map(
    (element) => {
      let texts;
      if (getText) {
        texts = getText(element);
      } else {
        text = options.key ? element[options.key] : element;
        texts = [text];
      }
      const preprocessedTexts = texts.map((text2) => {
        const item = text2 || "";
        const normalizedItem = normalizeText(item);
        const itemWords = new Set(normalizedItem.split(" "));
        return [item, normalizedItem, itemWords];
      });
      return [element, preprocessedTexts];
    }
  );
  return (query) => {
    const results = [];
    const normalizedQuery = normalizeText(query);
    const queryWords = normalizedQuery.split(" ");
    if (!normalizedQuery.length) {
      return [];
    }
    preprocessedCollection.forEach(([element, texts]) => {
      let bestScore = MAX_SAFE_INTEGER;
      const matches = [];
      for (let i = 0, len = texts.length; i < len; i += 1) {
        const [item, normalizedItem, itemWords] = texts[i];
        const result = matchesFuzzily(
          item,
          normalizedItem,
          itemWords,
          query,
          normalizedQuery,
          queryWords,
          strategy
        );
        if (result) {
          bestScore = Math.min(bestScore, result[0]);
          matches.push(result[1]);
        } else {
          matches.push(null);
        }
      }
      if (bestScore < MAX_SAFE_INTEGER) {
        results.push({ item: element, score: bestScore, matches });
      }
    });
    results.sort(sortByScore);
    return results;
  };
}

// src/microfuzz/index.ts
function createFuzzySearch(list, options) {
  return createFuzzySearchImpl(list, options || {});
}
var microfuzz_default = createFuzzySearch;

// src/provider.ts
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
    const fuzzySearch = microfuzz_default(this.layer.getLayers(), {
      getText: (item) => [item.options.title]
    });
    fuzzySearch(options.query).forEach((item) => {
      const marker = item.item;
      const latlng = marker.getLatLng();
      result.push({
        bounds: null,
        label: marker.options.title,
        // @ts-expect-error  // Marker doesn't have the right type
        raw: marker,
        x: latlng.lng,
        y: latlng.lat
      });
    });
    return result;
  }
};

// src/searchcontrol.ts

// node_modules/leaflet-geosearch/src/constants.ts
var ENTER_KEY = 13;
var ESCAPE_KEY = 27;
var ARROW_DOWN_KEY = 40;
var ARROW_UP_KEY = 38;
var ARROW_LEFT_KEY = 37;
var ARROW_RIGHT_KEY = 39;

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
    console.log(query);
    let results = await provider.search({ query });
    results = results.slice(0, t.options.maxSuggestions);
    t.resultList.render(results, t.options.resultFormat);
  } else {
    t.resultList.clear();
  }
}
function MapSearchControl(options) {
  const search = GeoSearch2.SearchControl(options);
  if (options.closeOnSubmit) {
    search.onSubmit = onSubmit.bind(search);
  }
  if (options.disableEnterSearch) {
    search.selectResult = selectResult.bind(search);
    search.autoSearch = autoSearch.bind(search);
  }
  return search;
}

// src/main.ts
L.MapSearchProvider = MapSearchProvider;
L.MapSearchControl = MapSearchControl;
