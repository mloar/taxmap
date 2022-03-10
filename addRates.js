const fs = require("fs");
const process = require("process");
const args = process.argv;
const rates = JSON.parse(fs.readFileSync("rates.json"));

const features = Object.values(args.slice(2).map(r => JSON.parse(fs.readFileSync(r)).features).flat().reduce((acc, cur) => {
  if (cur.properties.taxcode) {
    if (!(cur.properties.taxcode in acc)) {
      acc[cur.properties.taxcode] = {
        type: "Feature",
        geometry: {
          type: "GeometryCollection",
          geometries: [cur.geometry]
        },
        properties: {
          taxcode: cur.properties.taxcode,
          taxrate: rates[cur.properties.taxcode]
        }
      };
    } else {
      acc[cur.properties.taxcode].geometry.geometries.push(cur.geometry);
    }
  }
  return acc;
}, {}));

fs.writeFileSync("rates.kml", `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document id="root_doc">
    <Schema id="rates.schema">
      <SimpleField name="taxcode" type="string"/>
      <SimpleField name="taxrate" type="float"/>
    </Schema>
    <Document id="rates">
      <name>rates</name>
      ${features.map((f, i) => `<Placemark id="rates.${i}">
        <ExtendedData>
          <SchemaData schemaUrl="#rates.schema">
            <SimpleData name="taxcode">${f.properties.taxcode}</SimpleData>
            <SimpleData name="taxrate">${f.properties.taxrate}</SimpleData>
          </SchemaData>
        </ExtendedData>
        <MultiGeometry>
          ${f.geometry.geometries.map(g => `<Polygon>
            <outerBoundaryIs>
              <LinearRing>
                <coordinates>
                  ${g.coordinates[0].map(c => c.map(k => k.concat([0]).join(",")).join("\n                  "))}
                </coordinates>
              </LinearRing>
            </outerBoundaryIs>
          </Polygon>`).join("\n          ")}
        </MultiGeometry>
      </Placemark>`).join("\n      ")}
    </Document>
  </Document>
</kml>`);

/*let i = 0, f = 0;
while (f < features.length) {
  let size = 0;
  const myfeatures = [];
  while (f < features.length && size < 5000) {
    myfeatures.push(features[f]);
    size += features[f++].geometry.geometries.length;
  }
  fs.writeFileSync(`Batch-${i++}.geojson`, JSON.stringify({
    type: "FeatureCollection",
    features: myfeatures
  }));
}*/
