# West Sussex NNDR Lookup

A Reuters-style NNDR (business rates) explorer for West Sussex. The app loads CSV data, provides dashboard summaries, town/type exploration, a global search, and an interactive map with heatmap/points modes.

## Features
- Dashboard KPIs and top-10 charts
- Explore by Town and by Business Type
- Global search with filters (town/type)
- Results table + map side-by-side
- Map modes: Heatmap (all filtered results) and Points (current page)
- Click a row to focus the map and show details

## Data
Place your data file here:

```
public/data/nndr-data.csv
```

Required columns (case/spacing trimmed by parser):
- `Property Reference`
- `Parish`
- `Account Holder 1`
- `Property Description`
- `Rateable Value`
- `Post Code`
- `Latitude`
- `Longitude`

Latitude/Longitude are used directly for mapping. If missing, records will not appear on the map.

## Setup

```bash
npm install
npm run dev
```

Open:
```
http://localhost:5173
```

## Build

```bash
npm run build
npm run preview
```

## Notes
- Heatmap uses all filtered results; points use the current table page.
- Zooming in switches heatmap to points automatically.
- Map view can be expanded/shrunk for more space.
