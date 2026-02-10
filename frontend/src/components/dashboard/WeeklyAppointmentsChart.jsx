import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function WeeklyAppointmentsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="dmFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#d42674" stopOpacity={0.6} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="day" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#4f46e5"
          strokeWidth={3}
          fill="url(#dmFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}