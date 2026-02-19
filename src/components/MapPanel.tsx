import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { GeocodePoint } from '../hooks/useGeocoding';
import { compactCurrency } from '../utils/format';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RateRecord } from '../utils/csvParser';

const CENTER: [number, number] = [50.93, -0.33];

function FitBounds({
  points,
  selectedKey,
  fitKey,
  resetKey,
}: {
  points: GeocodePoint[];
  selectedKey: string | null;
  fitKey: string;
  resetKey: number;
}) {
  const map = useMap();
  const lastFitKey = useRef<string | null>(null);
  const lastSelected = useRef<string | null>(null);

  useEffect(() => {
    if (!points.length) return;
    if (lastFitKey.current === fitKey) return;
    const bounds = points.map((point) => [point.lat, point.lng] as [number, number]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    lastFitKey.current = fitKey;
  }, [map, points, fitKey]);

  useEffect(() => {
    if (!selectedKey) return;
    if (lastSelected.current === selectedKey) return;
    const match = points.find((point) => `${point.lat},${point.lng}` === selectedKey);
    if (!match) return;
    map.flyTo([match.lat, match.lng], Math.max(map.getZoom(), 13), { duration: 0.6 });
    lastSelected.current = selectedKey;
  }, [map, points, selectedKey]);

  useEffect(() => {
    if (!resetKey) return;
    const bounds = points.map((point) => [point.lat, point.lng] as [number, number]);
    if (!bounds.length) return;
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [map, points, resetKey]);

  return null;
}

function HeatLayer({ points }: { points: GeocodePoint[] }) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!map) return;
    const heatPoints = points.map((point) => [
      point.lat,
      point.lng,
      Math.max(0.2, Math.min(1, point.count / 10)),
    ]) as [number, number, number][];

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    if (heatPoints.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const heatLayer = (L as any).heatLayer(heatPoints, {
        radius: 38,
        blur: 28,
        maxZoom: 15,
        minOpacity: 0.35,
        gradient: { 0.1: '#93c5fd', 0.4: '#60a5fa', 0.7: '#2563eb', 1: '#f97316' },
      });
      heatLayer.addTo(map);
      layerRef.current = heatLayer;
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points]);

  return null;
}

function ZoomWatcher({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

export default function MapPanel({
  points,
  heatPoints,
  selectedKey,
  selectedRow,
  fitKey,
  mode,
  onModeChange,
  onClearSelection,
  onReset,
  resetKey,
  expanded,
  onToggleExpand,
}: {
  points: GeocodePoint[];
  heatPoints: GeocodePoint[];
  selectedKey: string | null;
  selectedRow: RateRecord | null;
  fitKey: string;
  mode: 'heat' | 'points';
  onModeChange: (mode: 'heat' | 'points') => void;
  onClearSelection: () => void;
  onReset: () => void;
  resetKey: number;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const radiusScale = useMemo(() => {
    const max = points.reduce((acc, point) => Math.max(acc, point.total), 0);
    return max > 0 ? Math.max(1, Math.sqrt(max) / 1200) : 1;
  }, [points]);
  const [zoomLevel, setZoomLevel] = useState(11);
  const showPointsInHeatMode = zoomLevel >= 12;

  return (
    <div className="card map-card">
      <div className="map-header">
        <div className="card-title">Map View (Postcode Approximation)</div>
        <div className="map-toggle">
          <button className="button ghost" type="button" onClick={onToggleExpand}>
            {expanded ? 'Shrink Map' : 'Expand Map'}
          </button>
          <button className="button ghost" type="button" onClick={onReset}>
            Reset View
          </button>
          <button
            className={`button ghost ${mode === 'heat' ? 'active' : ''}`}
            type="button"
            onClick={() => onModeChange('heat')}
          >
            Heatmap
          </button>
          <button
            className={`button ghost ${mode === 'points' ? 'active' : ''}`}
            type="button"
            onClick={() => onModeChange('points')}
          >
            Points
          </button>
        </div>
      </div>
      <div className="map-wrap">
        <MapContainer center={CENTER} zoom={11} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <ZoomWatcher onZoomChange={setZoomLevel} />
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={points} selectedKey={selectedKey} fitKey={fitKey} resetKey={resetKey} />
          {mode === 'heat' && !showPointsInHeatMode ? <HeatLayer points={heatPoints} /> : null}
          {mode === 'points' || (mode === 'heat' && showPointsInHeatMode)
            ? points.map((point) => (
                <CircleMarker
                  key={`${point.lat}-${point.lng}`}
                  center={[point.lat, point.lng]}
                  radius={
                    Math.max(4, Math.sqrt(point.count) * radiusScale) +
                    (`${point.lat},${point.lng}` === selectedKey ? 10 : 0)
                  }
                  pathOptions={{
                    color: `${point.lat},${point.lng}` === selectedKey ? '#ea580c' : '#1d4ed8',
                    fillColor: `${point.lat},${point.lng}` === selectedKey ? '#f59e0b' : '#38bdf8',
                    fillOpacity: 0.6,
                  }}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -6]}
                    opacity={1}
                    sticky={!selectedKey}
                    permanent={`${point.lat},${point.lng}` === selectedKey}
                  >
                    <div>
                      <strong>{point.postcode}</strong>
                      <div>{point.count} properties</div>
                      <div>Total {compactCurrency.format(point.total)}</div>
                      <div>{point.samples[0]?.accountHolder}</div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              ))
            : null}
        </MapContainer>
        {points.length === 0 ? <div className="map-empty">No mappable records on this page.</div> : null}
        {selectedRow ? (
          <div className="map-detail-card">
            <div className="map-detail-title">{selectedRow.accountHolder || 'Account Holder'}</div>
            <div className="map-detail-meta">{selectedRow.propertyType || 'Business Type'}</div>
            <div className="map-detail-row">{selectedRow.address}</div>
            <div className="map-detail-row">
              {selectedRow.parish} {selectedRow.postcode ? `· ${selectedRow.postcode}` : ''}
            </div>
            <div className="map-detail-row">
              Rateable Value {compactCurrency.format(selectedRow.rateableValue)}
            </div>
            <button className="button ghost small" type="button" onClick={onClearSelection}>
              Clear Selection
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
