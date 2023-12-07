import { Plugin, UIRenderProps } from '@pdfme/common';
import { image } from '@pdfme/schemas';

import type { MapImage } from './types';

import { 
  DEFAULT_WIDTH, DEFAULT_HEIGHT, DEFAULT_MAP_VIEW, 
  DEFAULT_MAP_STYLE_FILL, DEFAULT_MAP_STYLE_STROKE, DEFAULT_GEOJSON 
} from './constants';
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
  schema: {
    'pointLocation': {
      type: 'object',
      title: 'Point Location (WGS84)',
      properties: {
        'lon': {
          title: 'Longitude',
          type: 'number',
          default: DEFAULT_GEOJSON.features[0].geometry.coordinates[0],
          props: {
            placeholder: 'Enter longitude'
          },
          min: -180,
          max: 180,
        },
        'lat': {
          title: 'Latitude',
          type: 'number',
          default: DEFAULT_GEOJSON.features[0].geometry.coordinates[1],
          props: {
            placeholder: 'Enter latitude'
          },
          min: -90,
          max: 90,
        }
      }
    }
  },
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
    pointLocation: {
      lon: DEFAULT_GEOJSON.features[0].geometry.coordinates[0],
      lat: DEFAULT_GEOJSON.features[0].geometry.coordinates[1],
    },
  },
};

// Export the map plugin
export const mapimage: Plugin<MapImage> = { ui, pdf, propPanel };
