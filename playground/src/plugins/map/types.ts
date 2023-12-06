import { Schema } from '@pdfme/common';

export interface MapImage extends Schema {
  mapView: {
    center: {
      lon: number;
      lat: number;
    };
    zoom: number;
  },
  mapStyle: {
    fill: {
      color: string;
      width: number;
    },
    stroke: {
      color: string;
    }
  },
  geojson: object
};

export interface MapState {
  center: [number, number];
  zoom: number;
  dataUrl: string;
}
