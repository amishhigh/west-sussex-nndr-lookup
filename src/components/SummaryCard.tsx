type SummaryCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export default function SummaryCard({ label, value, hint }: SummaryCardProps) {
  return (
    <div className="card summary-card">
      <div className="summary-label">{label}</div>
      <div className="summary-value">{value}</div>
      {hint ? <div className="summary-hint">{hint}</div> : null}
    </div>
  );
}
