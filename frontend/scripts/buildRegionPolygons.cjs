const fs = require('fs');
const path = require('path');

const REGION_LIST = ['Muntenia', 'Banat', 'Transilvania', 'Moldova', 'Dobrogea'];

const regionByCounty = {
  Alba: 'Transilvania',
  Arad: 'Transilvania',
  Bihor: 'Transilvania',
  'Bistrita-Nasaud': 'Transilvania',
  Brasov: 'Transilvania',
  Cluj: 'Transilvania',
  Covasna: 'Transilvania',
  Harghita: 'Transilvania',
  Hunedoara: 'Transilvania',
  Maramures: 'Transilvania',
  Mures: 'Transilvania',
  Sibiu: 'Transilvania',
  'Satu Mare': 'Transilvania',
  Salaj: 'Transilvania',

  Timis: 'Banat',
  'Caras-Severin': 'Banat',

  Arges: 'Muntenia',
  Bucuresti: 'Muntenia',
  Braila: 'Muntenia',
  Buzau: 'Muntenia',
  Calarasi: 'Muntenia',
  Dambovita: 'Muntenia',
  Dolj: 'Muntenia',
  Gorj: 'Muntenia',
  Giurgiu: 'Muntenia',
  Ialomita: 'Muntenia',
  Ilfov: 'Muntenia',
  Mehedinti: 'Muntenia',
  Olt: 'Muntenia',
  Prahova: 'Muntenia',
  Teleorman: 'Muntenia',
  Valcea: 'Muntenia',

  Bacau: 'Moldova',
  Botosani: 'Moldova',
  Galati: 'Moldova',
  Iasi: 'Moldova',
  Neamt: 'Moldova',
  Suceava: 'Moldova',
  Vaslui: 'Moldova',
  Vrancea: 'Moldova',

  Constanta: 'Dobrogea',
  Tulcea: 'Dobrogea'
};

const dataPath = path.resolve(__dirname, '../src/data/romania-counties.geojson');
const geojson = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const output = Object.fromEntries(REGION_LIST.map((region) => [region, []]));

const formatCoord = (value) => Number(value.toFixed(4));

for (const feature of geojson.features) {
  const name = feature?.properties?.name?.trim();
  const region = regionByCounty[name];
  if (!region) {
    console.warn(`Skipping county without mapping: ${name}`);
    continue;
  }

  let coordinates = feature.geometry.coordinates;
  if (feature.geometry.type === 'Polygon') {
    coordinates = [coordinates];
  }

  for (const polygon of coordinates) {
    const outerRing = polygon[0];
    if (!outerRing) continue;

    const converted = outerRing.map(([lng, lat]) => [
      formatCoord(lat),
      formatCoord(lng)
    ]);

    output[region].push(converted);
  }
}

const outputPath = path.resolve(__dirname, '../src/constants/region-polygons.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`Wrote ${outputPath}`);
