import { PropPanelSchema, ZOOM } from '@pdfme/common';
import { DEFAULT_MAX_ZOOM_TO_EXTENT, DEFAULT_MAP_STYLE_OPACITY } from './constants';
import type { MapState } from './types';

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

const mapStates: Record<string, MapState> = {};

const saveMapState = (key: string, state: MapState): void => {
  mapStates[key] = state;
  console.log('mapStates', mapStates);
}

const loadMapState = (key: string): MapState | null => {
  return mapStates[key] || null;
}
/**
 * Setup the map instance
 * @param schema
 * @param rootElement
 * @param mode
 * @param key
 * @returns
 */
export const setupMap = (schema: PropPanelSchema, rootElement: HTMLDivElement, mode: string, key: string) => {

  const mapDiv = document.createElement('div') as HTMLDivElement;
  mapDiv.style.width = `${schema.width as number * ZOOM}px`;
  mapDiv.style.height = `${schema.height as number * ZOOM}px`;
  rootElement.appendChild(mapDiv);

  const raster = new TileLayer({ source: new OSM() });

  const pointStyle = new Style({
    image: new CircleStyle({
      radius: 10,
      fill: new Fill(schema.mapStyle.stroke),
      stroke: new Stroke(schema.mapStyle.fill)
    })
  });

  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(schema.geojson, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    })
  });

  const vector = new VectorLayer({
    source: vectorSource as any,
    style: pointStyle,
    opacity: DEFAULT_MAP_STYLE_OPACITY ? DEFAULT_MAP_STYLE_OPACITY : 0.7,
  });

  const attributionControl = new Attribution({
    collapsible: false,
  });

  const map = new Map({
    layers: [raster, vector],
    target: mapDiv,
    view: new View({
      center: [
        schema.mapView.center.lon as number, 
        schema.mapView.center.lat as number],
      zoom: schema.mapView.zoom as number,
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
    map.getView().fit(vectorSource.getExtent(), { 
      maxZoom: DEFAULT_MAX_ZOOM_TO_EXTENT ? DEFAULT_MAX_ZOOM_TO_EXTENT : 7 
    });
  }
  
  return map;
};

// Debounce timer
let debounceTimer: any;

/**
 * Update the map and trigger onChange
 * @param map 
 * @param key 
 * @param onChange 
 * @param debounceTime 
 */
export const updateMap = (map: any, key: string, onChange: Function, debounceTime = 1000) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    generateDataUrl(map, key)
      .then(dataUrl => {
        if (onChange) {
          onChange(dataUrl);
        }
      })
      .catch(error => console.error(error));
  }, debounceTime);
};

const generateDataUrl = (map: any, key: string) => {
  return new Promise((resolve, reject) => {
    // Delay to ensure map tiles are loaded
    setTimeout(() => {
      const size = map.getSize();
      if (!size) {
        reject('Map size not available');
        return;
      }

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = size[0];
      exportCanvas.height = size[1];
      const exportContext = exportCanvas.getContext('2d');

      if (!exportContext) {
        reject('Failed to get canvas context');
        return;
      }

      // Draw each canvas from the map onto the export canvas
      document.querySelectorAll('.ol-layer canvas').forEach(function (canvasElement) {
        const canvas = canvasElement as HTMLCanvasElement;
        if (canvas.width > 0) {
          const parentNode = canvas.parentNode as HTMLElement;
          if (parentNode) {
            exportContext.globalAlpha = parentNode.style.opacity === '' ? 1 : Number(parentNode.style.opacity);
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

      // Get the dataUrl from the export canvas
      const data = exportCanvas.toDataURL('image/png');
      const currentState = mapStates[key] || { center: [0, 0], zoom: 2, dataUrl: '' };

    // Only update and trigger onChange if the dataUrl has changed
    if (currentState.dataUrl !== data) {
        const view = map.getView();
        const newState: MapState = {
          center: view.getCenter() as [number, number],
          zoom: view.getZoom() as number,
          dataUrl: data
        };
        saveMapState(key, newState);
        resolve(newState.dataUrl);
      } else {
        resolve(currentState.dataUrl);
      }
    }, 500);
  });
};
