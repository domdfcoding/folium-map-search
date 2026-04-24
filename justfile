default: lint

pdf-docs: latex-docs
	make -C doc-source/build/latex/

latex-docs:
	SPHINX_BUILDER=latex tox -e docs

unused-imports:
	tox -e lint -- --select F401

incomplete-defs:
	tox -e lint -- --select MAN

commas:
	tox -e lint -- --select C810,C812,C813,C814,C815,C816

vdiff:
	git diff $(repo-helper show version -q)..HEAD

bare-ignore:
	greppy '# type:? *ignore(?!\[|\w)' -s

lint: unused-imports incomplete-defs bare-ignore myts
	tox -n qa

myts:
	npx tsc --noEmit

build:
	npm pack
	tox -e build

js:
	npx esbuild src/main.ts --bundle --outfile=folium_map_search/folium-map-search.js "--external:./src/microfuzz/*.ts" --external:leaflet --external:leaflet-geosearch --format=esm --banner:js='const GeoSearch2=GeoSearch' --sourcemap
	sed -i '/^import/s/^/\/\//' folium_map_search/folium-map-search.js
	sed -i '/^export/s/^/\/\//' folium_map_search/folium-map-search.js

	npx esbuild src/microfuzz/index.ts --bundle --outfile=folium_map_search/microfuzz.js --format=esm --sourcemap
	sed -i '/^import/s/^/\/\//' folium_map_search/microfuzz.js
	sed -i '/^export/s/^/\/\//' folium_map_search/microfuzz.js

	npx esbuild src/main.ts --bundle --outfile=folium_map_search/folium-map-search.bundle.js --external:leaflet --external:leaflet-geosearch --format=esm --banner:js='const GeoSearch2=GeoSearch' --sourcemap
	sed -i '/^import/s/^/\/\//' folium_map_search/folium-map-search.bundle.js
	sed -i '/^export/s/^/\/\//' folium_map_search/folium-map-search.bundle.js


licence-report:
	npx license-report --only=prod --output html > licence-report.html
