#!/usr/bin/env python3
#
#  __init__.py
"""
Adds a control to search for major places on the map and for map markers.
"""
#
#  Copyright © 2026 Dominic Davis-Foster <dominic@davis-foster.co.uk>
#
#  Permission is hereby granted, free of charge, to any person obtaining a copy
#  of this software and associated documentation files (the "Software"), to deal
#  in the Software without restriction, including without limitation the rights
#  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
#  copies of the Software, and to permit persons to whom the Software is
#  furnished to do so, subject to the following conditions:
#
#  The above copyright notice and this permission notice shall be included in all
#  copies or substantial portions of the Software.
#
#  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
#  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
#  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
#  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
#  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
#  OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
#  OR OTHER DEALINGS IN THE SOFTWARE.
#

# 3rd party
import folium.elements
from folium.template import Template
from folium.utilities import parse_options

# this package
from folium_map_search.providers import *

__all__ = [
		"AMapProvider",
		"BingProvider",
		"EsriProvider",
		"GeoApiFrProvider",
		"GeoapifyProvider",
		"GeocodeEarthProvider",
		"GoogleProvider",
		"HereProvider",
		"LegacyGoogleProvider",
		"LocationIQProvider",
		"MapBoxProvider",
		"MapSearchControl",
		"MapSearchProvider",
		"OpenCageProvider",
		"OpenStreetMapProvider",
		"PdokNlProvider",
		"PeliasProvider",
		"Provider",
		]

__author__: str = "Dominic Davis-Foster"
__copyright__: str = "2026 Dominic Davis-Foster"
__license__: str = "MIT License"
__version__: str = "0.1.0b6"
__email__: str = "dominic@davis-foster.co.uk"

# ControlPosition = "topleft" | "topright" | "bottomleft" | "bottomright"
# style: 'button' | 'bar';


class MapSearchControl(folium.elements.JSCSSMixin, folium.elements.MacroElement):  # noqa: PRM003
	r"""
	Control to search for major places on the map and for map markers.

	:param provider: The provider to use for searching.
	:param close_on_submit: Close the search box after selecting a result.
	:param disable_enter_search: Diable searching with the enter key, only when a result is clicked.
	:param position: The control's position on the map.
	:param style: The stye of the search element.
	:param max_markers:
	:param show_marker:
	:param show_popup:
	:param search_label:
	:param clear_search_label:
	:param not_found_message:
	:param message_hide_delay:
	:param animate_zoom:
	:param retain_zoom_level:
	:param auto_complete:
	:param auto_complete_delay:
	:param max_suggestions:
	:param auto_close:
	:param keep_result:
	:param update_map:
	:param reset_button:
	:param \*\*kwargs: Additional options for the javascript ``MapSearchControl`` class.
	"""

	# TODO: keyword parameters; remove defaults or use None and put actual defaults in docstring
	def __init__(
			self,
			provider: Provider,
			*,
			close_on_submit: bool = False,
			disable_enter_search: bool = False,
			# position: str = "topleft",  # TODO: enum
			# style: str = "button",  # TODO: enum
			# # TODO: marker: MarkerOptions;
			# max_markers: float = 1,
			# show_marker: bool = False,
			# show_popup: bool = False,
			# # TODO: popup_format<T = any>(args: {query: Selection; result: SearchResult<T>;}): str,
			# # TODO: result_format<T = any>(args: {result: SearchResult<T>;}): str,
			# search_label: str = "Enter address",
			# clear_search_label: str = "Clear search",
			# not_found_message: str = '',
			# message_hide_delay: float = 300,
			# animate_zoom: bool = True,
			# # TODO: doesn't seem to work zoomLevel: float = 18,
			# retain_zoom_level: bool = False,
			# # TODO:class_names: { container: str, button: str, resetButton: str, msgbox: str, form: str, input: str, resultlist: str, item: str, notfound: str,};
			# auto_complete: bool = True,
			# auto_complete_delay: float = 250,
			# max_suggestions: float = 5,
			# auto_close: bool = False,  # TODO: perhaps True as well, or does it have no effect?
			# keep_result: bool = False,
			# update_map: bool = True,
			# reset_button: str = '×',
			**kwargs,
			):
		super().__init__()

		self._name = "MapSearchControl"
		self.provider = provider
		self.options = parse_options(
				close_on_submit=close_on_submit,
				disable_enter_search=disable_enter_search,
				# position=position,
				# style=style,
				# max_markers=max_markers,
				# show_marker=show_marker,
				# show_popup=show_popup,
				# search_label=search_label,
				# clear_search_label=clear_search_label,
				# not_found_message=not_found_message,
				# message_hide_delay=message_hide_delay,
				# animate_zoom=animate_zoom,
				# retain_zoom_level=retain_zoom_level,
				# auto_complete=auto_complete,
				# auto_complete_delay=auto_complete_delay,
				# max_suggestions=max_suggestions,
				# auto_close=auto_close,
				# keep_result=keep_result,
				# update_map=update_map,
				# reset_button=reset_button,
				**kwargs,
				)

	default_js = [
			(
					"leaflet-geosearch_js",
					"https://unpkg.com/leaflet-geosearch@4.4.0/dist/bundle.min.js",
					),
			(
					"folium-map-search_js",
					f"https://cdn.jsdelivr.net/gh/domdfcoding/folium-map-search@v{__version__}/folium_map_search/folium-map-search.bundle.min.js",
					),
			]

	default_css = [
			(
					"leaflet-geosearch_css",
					"https://unpkg.com/leaflet-geosearch@4.4.0/dist/geosearch.css",
					),
			]

	_template = Template(
			"""
			{% macro script(this, kwargs) %}
				var {{this.get_name()}} = L.MapSearchControl({
					provider: {{this.provider.render().strip()}},
					...{{this.options | tojson}},
					}
				)

				// Close search box when map clicked.
				{{ this._parent.get_name() }}.on('click', {{this.get_name()}}.close, {{this.get_name()}});

				{{this.get_name()}}.addTo({{ this._parent.get_name() }});
			{% endmacro %}
			""",
			)
