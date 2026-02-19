import { useEffect, useMemo, useState } from 'react';
import BarChart from '../components/BarChart';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchDropdown from '../components/SearchDropdown';
import SummaryCard from '../components/SummaryCard';
import { useCSVData } from '../hooks/useCSVData';
import { compactCurrency, currency, numberFormat } from '../utils/format';
import { ColumnDef } from '@tanstack/react-table';
import { RateRecord } from '../utils/csvParser';
import MapPanel from '../components/MapPanel';

export default function Dashboard() {
  const { aggregations, data, loading, error } = useCSVData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTown, setSelectedTown] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [pageRows, setPageRows] = useState<RateRecord[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<RateRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [mapMode, setMapMode] = useState<'heat' | 'points'>('heat');
  const [selectionTriggered, setSelectionTriggered] = useState(false);
  const [mapResetKey, setMapResetKey] = useState(0);
  const [mapExpanded, setMapExpanded] = useState(false);

  const topTownData = useMemo(() => {
    if (!aggregations) return [];
    return Object.entries(aggregations.byTown)
      .map(([name, group]) => ({ name, value: group.total }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [aggregations]);

  const topTypeData = useMemo(() => {
    if (!aggregations) return [];
    return Object.entries(aggregations.byType)
      .map(([name, group]) => ({ name, value: group.total }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [aggregations]);

  const columns = useMemo<ColumnDef<RateRecord>[]>(
    () => [
      { header: 'Account Holder', accessorKey: 'accountHolder' },
      { header: 'Property Ref', accessorKey: 'propertyRef' },
      { header: 'Town', accessorKey: 'parish' },
      { header: 'Address', accessorKey: 'address' },
      { header: 'Business Type', accessorKey: 'propertyType' },
      {
        header: 'Rateable Value',
        accessorKey: 'rateableValue',
        cell: (info) => currency.format(Number(info.getValue())),
      },
    ],
    []
  );

  const townOptions = useMemo(() => {
    if (!aggregations) return [];
    return Object.keys(aggregations.byTown)
      .sort((a, b) => a.localeCompare(b))
      .map((town) => ({ label: town, value: town }));
  }, [aggregations]);

  const typeOptions = useMemo(() => {
    if (!aggregations) return [];
    return Object.keys(aggregations.byType)
      .sort((a, b) => a.localeCompare(b))
      .map((type) => ({ label: type, value: type }));
  }, [aggregations]);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (selectedTown && row.parish !== selectedTown) return false;
      if (selectedType && row.propertyType !== selectedType) return false;
      return true;
    });
  }, [data, selectedTown, selectedType]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return filteredData;
    return filteredData.filter((row) => {
      const haystack = [
        row.accountHolder,
        row.address,
        row.parish,
        row.propertyType,
        String(row.propertyRef ?? ''),
        row.postcode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [filteredData, searchQuery]);

  const buildMapPoints = (rows: RateRecord[]) => {
    const grouped = new Map<
      string,
      { lat: number; lng: number; count: number; total: number; postcode: string; samples: RateRecord[] }
    >();
    rows.forEach((row) => {
      if (row.latitude == null || row.longitude == null) return;
      const key = `${row.latitude},${row.longitude}`;
      const current = grouped.get(key);
      if (!current) {
        grouped.set(key, {
          lat: row.latitude,
          lng: row.longitude,
          count: 1,
          total: row.rateableValue,
          postcode: row.postcode,
          samples: [row],
        });
      } else {
        current.count += 1;
        current.total += row.rateableValue;
        if (current.samples.length < 3) current.samples.push(row);
      }
    });
    return Array.from(grouped.values());
  };

  const mapPointsPage = useMemo(() => buildMapPoints(pageRows), [pageRows]);
  const mapPointsAll = useMemo(() => buildMapPoints(searchResults), [searchResults]);

  const selectedKey = selectedRow && selectedRow.latitude != null && selectedRow.longitude != null
    ? `${selectedRow.latitude},${selectedRow.longitude}`
    : null;

  useEffect(() => {
    if (!selectedRow && selectionTriggered) {
      setSelectionTriggered(false);
      setMapMode('heat');
    }
  }, [selectedRow, selectionTriggered]);
  const mapFitKey = useMemo(() => pageRows.map((row) => row.propertyRef).join('|'), [pageRows]);

  if (loading) return <LoadingSpinner />;
  if (error || !aggregations) {
    return <div className="error-state">{error ?? 'Unable to load data.'}</div>;
  }

  const totalTowns = Object.keys(aggregations.byTown).length;
  const totalTypes = Object.keys(aggregations.byType).length;

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-content">
          <h1>District NNDR Overview</h1>
          <p>
            Explore rateable value distribution across towns and business types. All metrics update from the
            latest CSV snapshot.
          </p>
        </div>
        <div className="hero-badge">Live analytics</div>
      </section>

      <section className="grid grid-4">
        <SummaryCard
          label="Total Rateable Value"
          value={compactCurrency.format(aggregations.grandTotal)}
          hint="District-wide"
        />
        <SummaryCard
          label="Total Properties"
          value={numberFormat.format(aggregations.totalCount)}
          hint="Liable hereditaments"
        />
        <SummaryCard label="Number of Towns" value={numberFormat.format(totalTowns)} />
        <SummaryCard label="Business Types" value={numberFormat.format(totalTypes)} />
      </section>

      <section className="grid grid-2">
        <BarChart title="Top 10 Towns by Rateable Value" data={topTownData} />
        <BarChart title="Top 10 Business Types by Rateable Value" data={topTypeData} />
      </section>

      <section className="panel search-panel">
        <div>
          <h2>Global Search</h2>
          <p>Search across all properties by business name, address, town, or reference.</p>
        </div>
        <div className="search-controls">
          <div className="search-field large">
            <input
              className="input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search business name, address, town, or property reference"
            />
            <button
              className="button"
              type="button"
              onClick={() => setHasSearched(true)}
            >
              Search
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() => {
                setSearchQuery('');
                setHasSearched(false);
              }}
            >
              Clear
            </button>
          </div>
          <div className="search-filters">
            <SearchDropdown
              label="Filter by Town"
              options={townOptions}
              value={selectedTown}
              onChange={setSelectedTown}
              placeholder="All towns"
            />
            <SearchDropdown
              label="Filter by Business Type"
              options={typeOptions}
              value={selectedType}
              onChange={setSelectedType}
              placeholder="All business types"
            />
          </div>
          <div className="search-meta">
            <span className="search-meta-label">Results</span>
            <span className="search-meta-value">
              {hasSearched ? searchResults.length : 0}
            </span>
          </div>
        </div>
      </section>

      {hasSearched ? (
        <section className={`grid grid-2 map-layout${mapExpanded ? ' expanded' : ''}`}>
          <div className="map-side list-side">
            <DataTable
              columns={columns}
              data={searchResults}
              searchValue=""
              onSearchChange={() => {}}
              showSearch={false}
              onPageDataChange={setPageRows}
              getRowId={(row) => row.propertyRef.toString()}
              selectedRowId={selectedRowId}
            onRowClick={(row) => {
              setSelectedRowId(row.propertyRef.toString());
              setSelectedRow(row);
              setSelectionTriggered(true);
              setMapMode('points');
            }}
          />
        </div>
        <div className="map-side map-side">
          <MapPanel
            points={mapPointsPage}
            heatPoints={mapPointsAll}
            selectedKey={selectedKey}
            selectedRow={selectedRow}
            fitKey={mapFitKey}
            mode={mapMode}
            onModeChange={setMapMode}
            onClearSelection={() => {
              setSelectedRow(null);
              setSelectedRowId(null);
            }}
            onReset={() => setMapResetKey((prev) => prev + 1)}
            resetKey={mapResetKey}
            expanded={mapExpanded}
            onToggleExpand={() => setMapExpanded((prev) => !prev)}
          />
        </div>
      </section>
      ) : (
        <div className="empty-state">Run a search to view results and the map.</div>
      )}
    </div>
  );
}
