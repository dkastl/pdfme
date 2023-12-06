import { Schema } from '@pdfme/common';

interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
}

export interface GeoJSONType {
  type: string;
  features: GeoJSONFeature[];
}

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
  geojson?: GeoJSONType
};

export interface MapState {
  center: [number, number];
  zoom: number;
  dataUrl: string;
}