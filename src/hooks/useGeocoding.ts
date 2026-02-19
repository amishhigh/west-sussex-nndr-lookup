import { useEffect, useMemo, useRef, useState } from 'react';
import { RateRecord } from '../utils/csvParser';

export type GeocodePoint = {
  lat: number;
  lng: number;
  count: number;
  total: number;
  postcode: string;
  samples: RateRecord[];
};

type GeocodeState = {
  points: GeocodePoint[];
  loading: boolean;
  error: string | null;
  readyCount: number;
  totalCount: number;
};

const STORAGE_KEY = 'nndr:postcodeCache:v1';

function normalizePostcode(value: string): string {
  return value.trim().toUpperCase();
}

function readCache(): Record<string, { lat: number; lng: number }> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, { lat: number; lng: number }>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage errors
  }
}

async function fetchBatch(postcodes: string[]) {
  const response = await fetch('https://api.postcodes.io/postcodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postcodes }),
  });
  if (!response.ok) {
    throw new Error('Failed to geocode postcodes');
  }
  const payload = await response.json();
  return payload.result as Array<{ query: string; result: { latitude: number; longitude: number } | null }>;
}

export function useGeocoding(records: RateRecord[], enabled: boolean): GeocodeState {
  const [cache, setCache] = useState<Record<string, { lat: number; lng: number }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readyCount, setReadyCount] = useState(0);
  const totalCount = useMemo(() => {
    const unique = new Set(records.map((record) => normalizePostcode(record.postcode)).filter(Boolean));
    return unique.size;
  }, [records]);

  const queueRef = useRef<string[]>([]);
  const inFlightRef = useRef(false);

  useEffect(() => {
    setCache(readCache());
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const unique = Array.from(
      new Set(records.map((record) => normalizePostcode(record.postcode)).filter(Boolean))
    );
    const missing = unique.filter((postcode) => !cache[postcode]);
    queueRef.current = missing;
    setReadyCount(unique.length - missing.length);
    if (missing.length === 0) return;

    let cancelled = false;
    const run = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setLoading(true);
      try {
        while (queueRef.current.length && !cancelled) {
          const batch = queueRef.current.splice(0, 100);
          const results = await fetchBatch(batch);
          setCache((prev) => {
            const next = { ...prev };
            results.forEach((item) => {
              if (item.result) {
                next[normalizePostcode(item.query)] = {
                  lat: item.result.latitude,
                  lng: item.result.longitude,
                };
              }
            });
            writeCache(next);
            return next;
          });
          setReadyCount((prev) => prev + results.filter((item) => item.result).length);
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Geocoding error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          inFlightRef.current = false;
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      inFlightRef.current = false;
    };
  }, [records, cache, enabled]);

  const points = useMemo(() => {
    const grouped = new Map<string, GeocodePoint>();
    records.forEach((record) => {
      const postcode = normalizePostcode(record.postcode);
      if (!postcode) return;
      const coords = cache[postcode];
      if (!coords) return;
      const key = `${coords.lat},${coords.lng}`;
      const current = grouped.get(key);
      if (!current) {
        grouped.set(key, {
          lat: coords.lat,
          lng: coords.lng,
          count: 1,
          total: record.rateableValue,
          postcode,
          samples: [record],
        });
      } else {
        current.count += 1;
        current.total += record.rateableValue;
        if (current.samples.length < 3) current.samples.push(record);
      }
    });
    return Array.from(grouped.values());
  }, [records, cache]);

  return { points, loading, error, readyCount, totalCount };
}
