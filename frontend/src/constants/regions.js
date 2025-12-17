import rawRegionPolygons from './region-polygons.json';

const formatRegionPolygons = (raw) => (
  Object.fromEntries(
    Object.entries(raw).map(([region, polygons]) => [
      region,
      polygons.map((path) => path.map(([lat, lng]) => ({ lat, lng })))
    ])
  )
);

export const REGION_LIST = [
  'Muntenia',
  'Banat',
  'Transilvania',
  'Moldova',
  'Dobrogea'
];

export const REGION_POLYGONS = formatRegionPolygons(rawRegionPolygons);
