const fs = require("fs");
const process = require("process");
const gdal = require("gdal");
const xlsx = require("xlsx");

const wb = xlsx.read(fs.readFileSync("data/rates.xlsx"));
const rates = new Map(
  xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]).map(r => [r.Taxcode, Number(r.TaxcodeRate)])
);

const args = process.argv;
const features = Object.values(args.slice(2).map(r => JSON.parse(fs.readFileSync(r)).features).flat().reduce((acc, cur) => {
  if (cur.properties.taxcode) {
    if (!(cur.properties.taxcode in acc)) {
      acc[cur.properties.taxcode] = {
        taxcode: cur.properties.taxcode,
        taxrate: rates.get(cur.properties.taxcode),
        geo: new gdal.GeometryCollection()
      };
    }
    acc[cur.properties.taxcode].geo.children.add(gdal.Geometry.fromGeoJson(cur.geometry));
  }
  return acc;
}, {}));

features.forEach(f => f.geo = f.geo.convexHull());
features.sort((a, b) => b.geo.getArea() - a.geo.getArea());
features.forEach((f, i) => features.slice(i + 1).forEach(g => { f.geo = f.geo.difference(g.geo) }));

const uniqueRates = Array.from(new Set(features.map(f => f.taxrate)));
const maxRate = Math.max(...uniqueRates);
const minRate = Math.min(...uniqueRates);
const color1 = {red: 0, green: 0, blue: 255};
const color2 = {red: 255, green: 0, blue: 0};
const resultRed = percent => color1.red + percent * (color2.red - color1.red);
const resultGreen = percent => color1.green + percent * (color2.green - color1.green);
const resultBlue = percent => color1.blue + percent * (color2.blue - color1.blue);
const hexNum = num => num < 16 ? "0" + Math.round(num).toString(16) : Math.round(num).toString(16);
const spread = rate => (rate - minRate) / (maxRate - minRate);
const computeColor = rate => `88${hexNum(resultBlue(spread(rate)))}${hexNum(resultGreen(spread(rate)))}${hexNum(resultRed(spread(rate)))}`;

const chunks = Math.ceil(features.length / 2000);

Array(chunks).fill(0).map((e, i) => fs.writeFileSync(`rates-${i}.kml`, `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document id="root_doc">
    <Schema id="rates.schema">
      <SimpleField name="taxcode" type="string"/>
      <SimpleField name="taxrate" type="float"/>
    </Schema>
    ${uniqueRates.map(r => `<Style id="rate-${r}">
      <LineStyle>
        <color>${computeColor(r)}</color>
        <width>0.001</width>
      </LineStyle>
      <PolyStyle>
        <color>${computeColor(r)}</color>
        <outline>0</outline>
      </PolyStyle>
    </Style>`).join("\n    ")}
    <Document id="rates">
      <name>Property Tax Rates 2020 - Part ${i+1}</name>
      ${features.slice(i * 2000, ((i + 1) * 2000) - 1).map((f, i) => `<Placemark id="rates.${i}">
        <name>${f.taxcode}</name>
        <styleUrl>#rate-${f.taxrate}</styleUrl>
        <ExtendedData>
          <SchemaData schemaUrl="#rates.schema">
            <SimpleData name="taxcode">${f.taxcode}</SimpleData>
            <SimpleData name="taxrate">${f.taxrate}</SimpleData>
          </SchemaData>
        </ExtendedData>
        ${f.geo.toKML()}
      </Placemark>`).join("\n      ")}
    </Document>
  </Document>
</kml>`));
