#!/bin/sh
wget -O data/Cook-0.geojson "https://datacatalog.cookcountyil.gov/resource/c5mi-ck9v.geojson?\$limit=400000&\$order=:id"
sleep 5
wget -O data/Cook-1.geojson "https://datacatalog.cookcountyil.gov/resource/c5mi-ck9v.geojson?\$limit=400000&\$offset=400000&\$order=:id"
sleep 5
wget -O data/Cook-2.geojson "https://datacatalog.cookcountyil.gov/resource/c5mi-ck9v.geojson?\$limit=400000&\$offset=800000&\$order=:id"
sleep 5
wget -O data/Cook-3.geojson "https://datacatalog.cookcountyil.gov/resource/c5mi-ck9v.geojson?\$limit=400000&\$offset=1200000&\$order=:id"
