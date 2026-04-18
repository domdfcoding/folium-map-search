#!/usr/bin/env python3
#
#  providers.py
"""
Search providers.
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
import folium.map
from folium.template import Template
from folium.utilities import parse_options

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
		"MapSearchProvider",
		"OpenCageProvider",
		"OpenStreetMapProvider",
		"PdokNlProvider",
		"PeliasProvider",
		"Provider",
		]


class Provider:
	r"""
	Base class for all search providers.

	leaflet-geosearch uses so-called "providers" to take care of building the correct service URL and parsing the retrieved data into a uniform format.

	:param \*\*kwargs: Keyword arguments for the javascript ``Provider`` class.
	"""

	def __init__(self, **kwargs):
		self.options = parse_options(**kwargs)

	# Only use script macro
	_template = Template(
			"""
			{% macro script(this, kwargs) %}
			new GeoSearch.{{ this.__class__.__name__}}({{ this.options | tojson }})
			{% endmacro %}
			""",
			)

	def render(self) -> str:
		"""
		Render javascript.
		"""

		return self._template.module.__dict__["script"](self)


class BingProvider(Provider):
	pass


class EsriProvider(Provider):
	pass


class GeocodeEarthProvider(Provider):
	pass


class GoogleProvider(Provider):
	pass


class HereProvider(Provider):
	pass


class LocationIQProvider(Provider):
	pass


class OpenCageProvider(Provider):
	pass


class OpenStreetMapProvider(Provider):
	pass


class PeliasProvider(Provider):
	pass


class GeoapifyProvider(Provider):
	pass


class AMapProvider(Provider):
	pass


class GeoApiFrProvider(Provider):
	pass


class LegacyGoogleProvider(Provider):
	pass


class MapBoxProvider(Provider):
	pass


class PdokNlProvider(Provider):
	pass


class MapSearchProvider(OpenStreetMapProvider):  # noqa: PRM003
	r"""
	Custom provider for searching both OpenStreetMap settlements and map markers.

	:param map: The leaflet map.
	:param layer: The leaflet layer to search.
	:param viewbox: Optionally filter OpenStreetMap search queries to this bounding box. Format ``<lng1>,<lat1>,<lng2>,<lat2>``.
	:param feature_type: Optionally filter OpenStreetMap search queries to this feature type, e.g. ``'settlement'``.
	:param \*\*kwargs: Additional keyword arguments for the javascript ``Provider`` class.
	"""

	def __init__(
			self,
			map: folium.Map,  # noqa: A002  # pylint: disable=redefined-builtin
			layer: folium.map.Layer,
			**kwargs,
			):
		self.map = map
		self.layer = layer
		self.options = parse_options(**kwargs)

	# Only use script macro
	_template = Template(
			"""
			{% macro script(this, kwargs) %}
			new L.{{ this.__class__.__name__}}({
				map: {{this.map.get_name()}},
				layer: {{this.layer.get_name()}},
				...{{ this.options | tojson }},
				})
			{% endmacro %}
			""",
			)
