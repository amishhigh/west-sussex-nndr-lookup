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

export default function ByTown() {
  const { data, aggregations, loading, error } = useCSVData();
  const [selectedTown, setSelectedTown] = useState<string | null>(null);

  const options = useMemo(() => {
    if (!aggregations) return [];
    return Object.keys(aggregations.byTown)
      .sort((a, b) => a.localeCompare(b))
      .map((town) => ({ label: town, value: town }));
  }, [aggregations]);

  const selectedGroup = selectedTown && aggregations ? aggregations.byTown[selectedTown] : null;

  const topTypes = useMemo(() => {
    if (!selectedGroup) return [];
    const map: Record<string, number> = {};
    selectedGroup.properties.forEach((row) => {
      map[row.propertyType] = (map[row.propertyType] ?? 0) + row.rateableValue;
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
        header: 'Address',
        accessorKey: 'address',
      },
      {
        header: 'Business Type',
        accessorKey: 'propertyType',
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
          <h1>Explore by Town</h1>
          <p>Select a town or parish to see rateable value performance and property lists.</p>
        </div>
        <SearchDropdown
          label="Town / Parish"
          options={options}
          value={selectedTown}
          onChange={setSelectedTown}
          placeholder="Search town name"
        />
      </section>

      {selectedGroup ? (
        <>
          <section className="grid grid-4">
            <SummaryCard label="Town" value={selectedTown ?? ''} />
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
            <BarChart title="Top 10 Business Types in Town" data={topTypes} />
          </section>

          <section>
            <DataTable
              columns={columns}
              data={selectedGroup.properties}
              searchPlaceholder="Search addresses, business types, or account holders"
            />
          </section>
        </>
      ) : (
        <div className="empty-state">Choose a town to view analytics.</div>
      )}
    </div>
  );
}
