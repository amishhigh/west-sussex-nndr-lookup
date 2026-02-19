import { RateRecord } from './csvParser';

export type AggregatedGroup = {
  total: number;
  count: number;
  avg: number;
  pct: number;
  properties: RateRecord[];
};

export type Aggregations = {
  grandTotal: number;
  totalCount: number;
  byTown: Record<string, AggregatedGroup>;
  byType: Record<string, AggregatedGroup>;
};

export function computeAggregations(data: RateRecord[]): Aggregations {
  const grandTotal = data.reduce((sum, r) => sum + r.rateableValue, 0);
  const totalCount = data.length;

  const byTown: Record<string, AggregatedGroup> = {};
  const byType: Record<string, AggregatedGroup> = {};

  data.forEach((row) => {
    const town = row.parish || 'UNKNOWN';
    if (!byTown[town]) {
      byTown[town] = { total: 0, count: 0, avg: 0, pct: 0, properties: [] };
    }
    byTown[town].total += row.rateableValue;
    byTown[town].count += 1;
    byTown[town].properties.push(row);

    const type = row.propertyType || 'Unknown';
    if (!byType[type]) {
      byType[type] = { total: 0, count: 0, avg: 0, pct: 0, properties: [] };
    }
    byType[type].total += row.rateableValue;
    byType[type].count += 1;
    byType[type].properties.push(row);
  });

  Object.values(byTown).forEach((group) => {
    group.avg = group.count ? group.total / group.count : 0;
    group.pct = grandTotal ? group.total / grandTotal : 0;
  });

  Object.values(byType).forEach((group) => {
    group.avg = group.count ? group.total / group.count : 0;
    group.pct = grandTotal ? group.total / grandTotal : 0;
  });

  return { grandTotal, totalCount, byTown, byType };
}
