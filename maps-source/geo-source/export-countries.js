const fs = require('fs');
const topojsonClient = require('topojson-client');
const topojsonSimplify = require('topojson-simplify');

const raw = require('./node_modules/apexmaps-geo/world-countries-50m.json');
const objectName = Object.keys(raw.objects)[0];

const presimplified = topojsonSimplify.presimplify(raw, topojsonSimplify.sphericalTriangleArea);
const minWeight = topojsonSimplify.quantile(presimplified, 0.3);
const simplified = topojsonSimplify.simplify(presimplified, minWeight);

const fc = topojsonClient.feature(simplified, simplified.objects[objectName]);

const SETS = {
  small: ['France', 'Spain', 'Portugal'],
  medium: ['France', 'Spain', 'Portugal', 'Italy', 'Germany', 'Switzerland'],
  large: [
    'France', 'Spain', 'Portugal', 'Italy', 'Germany', 'Switzerland', 'Austria',
    'Belgium', 'Netherlands', 'United Kingdom', 'Poland',
  ],
};

for (const [key, names] of Object.entries(SETS)) {
  const features = names.map((name) => {
    const f = fc.features.find((feat) => feat.properties.name === name);
    if (!f) throw new Error(`not found: ${name}`);
    return { name, geometry: f.geometry };
  });
  fs.writeFileSync(`countries-${key}.json`, JSON.stringify(features));
  console.log(key, features.map((f) => f.name).join(', '));
}
