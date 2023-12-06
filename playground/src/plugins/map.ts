// map.ts
import { ZOOM, Plugin, Schema } from '@pdfme/common';
import { image } from '@pdfme/schemas';

import Map from 'ol/Map';
import View from 'ol/View';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Attribution from 'ol/control/Attribution';
import GeoJSON from 'ol/format/GeoJSON';

import Style from 'ol/style/Style';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';

import 'ol/ol.css';

interface MapImage extends Schema {}

interface MapDivElement extends HTMLDivElement {
  __map_instance?: Map;
}

interface MapState {
  center: [number, number];
  zoom: number;
}

const mapStates: Record<string, MapState> = {};

function saveMapState(key: string, state: MapState): void {
  mapStates[key] = state;
}

function loadMapState(key: string): MapState | null {
  return mapStates[key] || null;
}

function generateDataUrl(map: any, onChange: Function) {
  // Create a new canvas to merge all layer canvases
  const size = map.getSize();
  if (!size) {
    return; // Exit if size is undefined
  }

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = size[0];
  exportCanvas.height = size[1];
  const exportContext = exportCanvas.getContext('2d');

  if (exportContext) {
    // Draw each canvas from the map onto the export canvas
    document.querySelectorAll('.ol-layer canvas').forEach(function (canvasElement) {
      const canvas = canvasElement as HTMLCanvasElement;
      if (canvas.width > 0) {
        const parentNode = canvas.parentNode as HTMLElement;
        if (parentNode) {
          const opacity = parentNode.style.opacity;
          exportContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
  
          const transform = canvas.style.transform;
          const match = transform.match(/^matrix\(([^\(]*)\)$/);
          if (match) {
            const matrix = match[1].split(',').map(Number);
            // Apply matrix values to setTransform method
            exportContext.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
            exportContext.drawImage(canvas, 0, 0);
          }
        }
      }
    });

    // Reset transformations and alpha for the export canvas
    exportContext.globalAlpha = 1;
    exportContext.setTransform(1, 0, 0, 1, 0, 0);
  
    // Now you can use the combined canvas data
    const data = exportCanvas.toDataURL('image/jpeg');
    console.log('data', data.length);
    onChange && data && onChange(data);
  } else {
    console.error('Could not obtain 2D context from canvas');
  };
};

const setupMap = (mapDiv: HTMLElement, mode: string, key: string) => {
  const raster = new TileLayer({ source: new OSM() });

  const pointStyle = new Style({
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({ color: 'red' }),
      stroke: new Stroke({ color: 'white', width: 2 })
    })
  });

  const geojsonObject = {
    'type': 'FeatureCollection',
    'features': [{
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [135.2765, 34.7248] // Longitude, Latitude
      }
    }]
  };

  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(geojsonObject, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    })
  });

  const vector = new VectorLayer({
    source: vectorSource as any,
    style: pointStyle,
    opacity: 0.5,
  });

  const attributionControl = new Attribution({
    collapsible: false,
  });

  const map = new Map({
    layers: [raster, vector],
    target: mapDiv,
    view: new View({
      center: [0, 0],
      zoom: 2,
    }),
    controls: mode === 'viewer' ? [attributionControl] : undefined,
    interactions: mode === 'viewer' ? [] : undefined,
  });

  // Restore saved state if available
  const savedState = loadMapState(key);
  if (savedState) {
    map.getView().setCenter(savedState.center);
    map.getView().setZoom(savedState.zoom);
  } else {
    map.getView().fit(vectorSource.getExtent(), { maxZoom: 7 });
  }
  
  return map;
};

const ui = async (props: any) => {
  const { schema, onChange, rootElement, mode, key } = props;

  let mapDiv = rootElement.querySelector(`#map-${key}`) as MapDivElement;

  // Only create a new mapDiv if it doesn't already exist
  if (!mapDiv) {
    mapDiv = document.createElement('div') as MapDivElement;
    mapDiv.id = `map-${key}`;
    mapDiv.style.width = `${schema.width * ZOOM}px`;
    mapDiv.style.height = `${schema.height * ZOOM}px`;
    rootElement.appendChild(mapDiv);
  }

  // Create and setup the map instance
  const map = setupMap(mapDiv, mode, key); 

  // Attach moveend event listener
  map.on('moveend', () => {
    const view = map.getView();
    const state: MapState = {
      center: view.getCenter() as [number, number],
      zoom: view.getZoom() as number,
    };
    saveMapState(key, state);
    
    // Delayed data URL generation
    setTimeout(() => generateDataUrl(map, onChange), 500);
  });
};

const pdf = image.pdf;

const propPanel = {
  schema: {},
  defaultValue: '',
  defaultSchema: {
    type: 'mapimage',
    position: { x: 10, y: 10 },
    width: 80,
    height: 60
  },
};

// Export the map plugin
export const mapimage: Plugin<MapImage> = { ui, pdf, propPanel };
