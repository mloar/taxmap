#!/bin/sh
wget -O data/$1.geojson "https://datacatalog.cookcountyil.gov/resource/c5mi-ck9v.geojson?\$limit=500000&\$order=:id&municipality=$1"
wget -O data/$1-1.geojson "https://datacatalog.cookcountyil.gov/resource/c5mi-ck9v.geojson?\$limit=500000&\$offset=500000&\$order=:id&municipality=$1"
