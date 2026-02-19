import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Papa from 'papaparse';
import { cleanData, RateRecord } from '../utils/csvParser';
import { Aggregations, computeAggregations } from '../utils/aggregations';

export type CSVState = {
  data: RateRecord[];
  aggregations: Aggregations | null;
  loading: boolean;
  error: string | null;
};

const CSVContext = createContext<CSVState | null>(null);

export function CSVProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RateRecord[]>([]);
  const [aggregations, setAggregations] = useState<Aggregations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const response = await fetch('/data/nndr-data.csv');
        if (!response.ok) {
          throw new Error('Failed to load CSV file.');
        }
        const csvText = await response.text();
        const parsed = Papa.parse<Record<string, unknown>>(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          transformHeader: (header) => header.trim(),
        });

        if (parsed.errors.length) {
          throw new Error('CSV parsing error: ' + parsed.errors[0].message);
        }

        const cleaned = cleanData(parsed.data);
        const aggs = computeAggregations(cleaned);

        if (!cancelled) {
          setData(cleaned);
          setAggregations(aggs);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ data, aggregations, loading, error }), [data, aggregations, loading, error]);

  return <CSVContext.Provider value={value}>{children}</CSVContext.Provider>;
}

export function useCSVData(): CSVState {
  const context = useContext(CSVContext);
  if (!context) {
    throw new Error('useCSVData must be used within CSVProvider');
  }
  return context;
}
