## Technical notes

This document contains some technical notes on the data contained in Health Viz.

### Geographic shapes

Census tract, ZIP code, and County shapes were downloaded from the U.S. Census Bureau. "ZIP code" shapes are actually ZIP code tabulation areas, the geographic cousin of ZIP codes. Chicago community area shapes were downloaded from the City of Chicago data portal. Shapes were downloaded as shapefiles and converted to GeoJSON using GIS software. They were then simplified, split, and converted to topoJSON using [Mapshaper](https://github.com/mbloch/mapshaper). 

#### Community areas

Snap vertices, rename some of the properties, keep only 15% of the points, and reduce precision to ~1 meter (from ~1 angstrom)

```bash
mapshaper -i communityareas-original.geo.json snap -each 'id=area_numbe, delete area_numbe, name=community, delete community' -simplify 15% keep-shapes stats -o communityareas.geo.json force format=geojson precision=0.00001

mapshaper -i communityareas-original.geo.json snap -each 'id=area_numbe, delete area_numbe, name=community, delete community' -simplify 15% keep-shapes stats -o communityareas.topo.json force format=topojson precision=0.00001
```

#### ZIP Code Tabulation Areas

Snap vertices, remove properties, reduce precision, and keep only some of the points.

For the full-state topoJSON, reduce precision to ~10 meters and keep only 12% of the points (simplification threshold of around 52 meters).

For the geoJSON, reduce precision to ~1 meter and keep about 25% of the points (simplification threshold of about 19 meters). This makes the individual shapes about 5.2 KB on average. 

```bash
mapshaper -i zcta-temp.geo.json snap -each 'delete GEOID10' -simplify 25% keep-shapes stats -o zcta.geo.json force format=geojson precision=0.00001

mapshaper -i zcta-temp.geo.json snap -each 'delete GEOID10' -simplify 12% keep-shapes stats -o zcta.topo.json force format=topojson precision=0.0001
```

#### Census Tracts

Remove two Lake Michigan tracts, snap vertices, remove properties, reduce precision, and keep only some of the points.

For the full-state topoJSON, reduce precision to ~10 meters and keep only 13% of the points (simplification threshold of around 30 meters).

For the geoJSON, reduce precision to ~1 meter and keep about 25% of the points (simplification threshold of about 12 meters). This makes the individual shapes about 1.9 KB on average. 

```bash
mapshaper -i tracts-original.geo.json -filter 'geoid !== "17097990000" && geoid !== "17031990000"' -o tracts-temp.geo.json

mapshaper -i tracts-temp.geo.json -simplify 25% keep-shapes stats -o tracts.geo.json format=geojson force precision=0.00001

mapshaper -i tracts-temp.geo.json -simplify 13% keep-shapes stats -o tracts.topo.json format=topojson force precision=0.0001
```

#### Counties

Snap vertices, rename some of the properties, keep only 15% of the points, and reduce precision to ~10 meters (from ~1 angstrom)

```bash
mapshaper -i counties-original.geo.json snap -each 'id=String(17000+co_fips), delete cartodb_id, delete created_at, delete updated_at, name=name + " County, IL", delete co_fips' -simplify 15% keep-shapes stats -o counties.geo.json force format=geojson precision=0.0001 id-field=id

mapshaper -i counties-original.geo.json snap -each 'id=String(17000+co_fips), delete cartodb_id, delete created_at, delete updated_at, name=name + " County, IL", delete co_fips' -simplify 11% keep-shapes stats -o counties.topo.json force format=topojson precision=0.001 id-field=id
```
