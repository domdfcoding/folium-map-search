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
	npm run build
	sed -i -n '/^import/!p' folium_map_search/folium-map-search.js
	sed -i -n '/^export/!p' folium_map_search/folium-map-search.js


licence-report:
	npx license-report --only=prod --output html > licence-report.html
