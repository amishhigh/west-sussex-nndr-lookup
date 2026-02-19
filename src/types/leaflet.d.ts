declare module 'leaflet' {
  export type LatLngBoundsExpression = [number, number][] | [[number, number], [number, number]];
  export type PointExpression = [number, number] | { x: number; y: number };

  export interface FitBoundsOptions {
    padding?: PointExpression;
    maxZoom?: number;
  }

  export interface MapOptions {
    center?: [number, number];
    zoom?: number;
    scrollWheelZoom?: boolean;
  }

  export interface PathOptions {
    color?: string;
    fillColor?: string;
    fillOpacity?: number;
  }

  export interface CircleMarkerOptions extends PathOptions {
    radius?: number;
  }

  export interface TooltipOptions {
    direction?: string;
    offset?: PointExpression;
    opacity?: number;
    sticky?: boolean;
    permanent?: boolean;
  }

  export interface TileLayerOptions {
    attribution?: string;
  }

  export class Layer {
    addTo(map: Map): this;
  }

  export class LayerGroup<T = any> extends Layer {}

  export class Map {
    fitBounds(bounds: LatLngBoundsExpression, options?: FitBoundsOptions): this;
    flyTo(center: [number, number], zoom?: number, options?: { duration?: number }): this;
    getZoom(): number;
    removeLayer(layer: Layer): this;
    addLayer(layer: Layer): this;
  }

  const L: {
    heatLayer: (points: [number, number, number][], options?: Record<string, unknown>) => Layer;
  };

  export default L;
}
