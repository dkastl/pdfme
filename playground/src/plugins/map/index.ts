// map.ts
import { ZOOM, Plugin, Schema } from '@pdfme/common';
import { image } from '@pdfme/schemas';
import { setupMap, updateMap } from "./helper";

interface MapImage extends Schema {}

const ui = async (props: any) => {
  const { schema, onChange, rootElement, mode, key } = props;

  const mapDiv = document.createElement('div') as HTMLDivElement;
  mapDiv.style.width = `${schema.width * ZOOM}px`;
  mapDiv.style.height = `${schema.height * ZOOM}px`;
  rootElement.appendChild(mapDiv);

  // Create and setup the map instance
  const map = setupMap(mapDiv, mode, key); 

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
    position: { x: 10.0, y: 10.0 },
    width: 80.0,
    height: 60.0
  },
};

// Export the map plugin
export const mapimage: Plugin<MapImage> = { ui, pdf, propPanel };
