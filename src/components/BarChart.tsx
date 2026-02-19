import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { compactCurrency } from '../utils/format';

export type BarDatum = {
  name: string;
  value: number;
};

type BarChartProps = {
  title: string;
  data: BarDatum[];
  height?: number;
};

export default function HorizontalBarChart({ title, data, height = 380 }: BarChartProps) {
  return (
    <div className="card chart-card">
      <div className="card-title">{title}</div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 10, right: 24, top: 8, bottom: 8 }}
            barCategoryGap={18}
            barSize={18}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E6E9EF" />
            <XAxis
              type="number"
              tickFormatter={(value) => compactCurrency.format(value)}
              stroke="#64748B"
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fill: '#111827', fontSize: 12 }}
              tickMargin={8}
            />
            <Tooltip
              formatter={(value: number) => compactCurrency.format(value)}
              contentStyle={{
                background: '#0F172A',
                color: '#F8FAFC',
                borderRadius: 10,
                border: 'none',
              }}
              cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
            />
            <Bar dataKey="value" fill="url(#barGradient)" radius={[0, 8, 8, 0]} />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1D4ED8" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
