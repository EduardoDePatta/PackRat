const trailLayer = {
  id: 'trail',
  type: 'line',
  source: 'trail',
  paint: {
    'line-color': '#16b22d',
    'line-width': 4,
    'line-opacity': 1,
  },
};

const trailCapLayer = {
  id: 'trail-cap',
  type: 'circle',
  source: 'trail',
  paint: {
    'circle-radius': 6,
    'circle-color': '#16b22d',
  },
  filter: ['==', 'meta', 'end'],
};

const getUserLocationLayer = (lng, lat) => {
  return {
    id: 'user-location',
    type: 'circle',
    source: {
      type: 'geojson',
      data: {
        type: 'Point',
        coordinates: [lng, lat],
      },
    },
    paint: {
      'circle-radius': 8,
      'circle-color': '#3388ff',
    },
  };
};

const getPolygonLayer = ({ feature }) => {
  return {
    id: 'polygon-layer',
    type: 'fill',
    source: {
      type: 'geojson',
      data: feature,
    },
    paint: {
      'fill-color': '#3388ff',
      'fill-opacity': 0.3,
    },
  };
};

export { trailLayer, trailCapLayer, getUserLocationLayer, getPolygonLayer };
