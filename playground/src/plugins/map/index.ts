import { Plugin } from '@pdfme/common';
import { image } from '@pdfme/schemas';

import type { MapImage } from './types';

import { DEFAULT_WIDTH, DEFAULT_HEIGHT, DEFAULT_MAP_VIEW, DEFAULT_MAP_STYLE_FILL, DEFAULT_MAP_STYLE_STROKE, DEFAULT_GEOJSON } from "./constants";
import { setupMap, updateMap } from "./helper";

const ui = async (props: any) => {
  const { schema, onChange, rootElement, mode, key } = props;

  // Create and setup the map instance
  const map = setupMap(schema, rootElement, mode, key); 

  // Attach moveend event listener
  map.on('moveend', () => {
    updateMap(map, key, onChange);
  });
};

const pdf = image.pdf;

const propPanel = {
  schema: {},
  defaultValue: '',
  defaultSchema: {
    type: 'mapimage',
    position: { x: 0, y: 0 },
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    mapView: DEFAULT_MAP_VIEW,
    mapStyle: {
      fill: DEFAULT_MAP_STYLE_FILL,
      stroke: DEFAULT_MAP_STYLE_STROKE
    },
    geojson: DEFAULT_GEOJSON
  },
};

// Export the map plugin
export const mapimage: Plugin<MapImage> = { ui, pdf, propPanel };
