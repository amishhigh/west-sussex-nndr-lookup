export default function LoadingSpinner() {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <div>
        <div className="loading-title">Loading NNDR data</div>
        <div className="loading-subtitle">Parsing the CSV and preparing analytics.</div>
      </div>
    </div>
  );
}
