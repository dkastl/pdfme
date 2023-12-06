import { Plugin, UIRenderProps } from '@pdfme/common';
import { image } from '@pdfme/schemas';

import type { MapImage } from './types';

import { DEFAULT_WIDTH, DEFAULT_HEIGHT, DEFAULT_MAP_VIEW, DEFAULT_MAP_STYLE_FILL, DEFAULT_MAP_STYLE_STROKE, DEFAULT_GEOJSON } from "./constants";
import { setupMap, updateMap } from "./helper";

const ui = async (props: UIRenderProps<MapImage>) => {
  const { schema, rootElement, mode, key } = props;

  try {
    const map = await setupMap(schema, rootElement, mode, key);

    map.on('moveend', async () => {
      try {
        const dataUrl = await updateMap(map, key);
        console.log('dataUrl', dataUrl.length);
        schema.data = dataUrl;
      } catch (error) {
        console.error("Error in moveend event: ", error);
      }
    });
  } catch (error) {
    console.error("Error setting up the map: ", error);
  }
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
