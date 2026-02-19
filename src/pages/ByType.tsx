import { useMemo, useState } from 'react';
import BarChart from '../components/BarChart';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchDropdown from '../components/SearchDropdown';
import SummaryCard from '../components/SummaryCard';
import { useCSVData } from '../hooks/useCSVData';
import { compactCurrency, currency, numberFormat, percent } from '../utils/format';
import { ColumnDef } from '@tanstack/react-table';
import { RateRecord } from '../utils/csvParser';

export default function ByType() {
  const { aggregations, loading, error } = useCSVData();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const options = useMemo(() => {
    if (!aggregations) return [];
    return Object.keys(aggregations.byType)
      .sort((a, b) => a.localeCompare(b))
      .map((type) => ({ label: type, value: type }));
  }, [aggregations]);

  const selectedGroup = selectedType && aggregations ? aggregations.byType[selectedType] : null;

  const topTowns = useMemo(() => {
    if (!selectedGroup) return [];
    const map: Record<string, number> = {};
    selectedGroup.properties.forEach((row) => {
      map[row.parish] = (map[row.parish] ?? 0) + row.rateableValue;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [selectedGroup]);

  const columns = useMemo<ColumnDef<RateRecord>[]>(
    () => [
      {
        header: 'Account Holder',
        accessorKey: 'accountHolder',
      },
      {
        header: 'Property Ref',
        accessorKey: 'propertyRef',
        cell: (info) => info.getValue(),
      },
      {
        header: 'Town',
        accessorKey: 'parish',
      },
      {
        header: 'Address',
        accessorKey: 'address',
      },
      {
        header: 'Rateable Value',
        accessorKey: 'rateableValue',
        cell: (info) => currency.format(Number(info.getValue())),
      },
    ],
    []
  );

  if (loading) return <LoadingSpinner />;
  if (error || !aggregations) {
    return <div className="error-state">{error ?? 'Unable to load data.'}</div>;
  }

  return (
    <div className="page">
      <section className="panel">
        <div>
          <h1>Explore by Business Type</h1>
          <p>Pick a property type to see rateable value totals and town distribution.</p>
        </div>
        <SearchDropdown
          label="Business Type"
          options={options}
          value={selectedType}
          onChange={setSelectedType}
          placeholder="Search business type"
        />
      </section>

      {selectedGroup ? (
        <>
          <section className="grid grid-4">
            <SummaryCard label="Business Type" value={selectedType ?? ''} />
            <SummaryCard label="Total Rateable Value" value={compactCurrency.format(selectedGroup.total)} />
            <SummaryCard label="Properties" value={numberFormat.format(selectedGroup.count)} />
            <SummaryCard label="District Share" value={percent(selectedGroup.pct)} />
          </section>

          <section className="grid grid-2">
            <SummaryCard
              label="Average Rateable Value"
              value={currency.format(selectedGroup.avg)}
              hint="Per property"
            />
            <BarChart title="Top 10 Towns for this Type" data={topTowns} />
          </section>

          <section>
            <DataTable
              columns={columns}
              data={selectedGroup.properties}
              searchPlaceholder="Search towns, addresses, or account holders"
            />
          </section>
        </>
      ) : (
        <div className="empty-state">Choose a business type to view analytics.</div>
      )}
    </div>
  );
}
