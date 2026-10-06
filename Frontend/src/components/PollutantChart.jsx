import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

const labelMap = {
  pm25: "PM2.5",
  pm10: "PM10",
  o3: "O₃",
  no2: "NO₂",
  so2: "SO₂",
  co: "CO",
  nh3: "NH₃",
};

const palette = {
  pm25: "#0066ff", // Accent Blue
  pm10: "#10b981", // Emerald
  o3: "#f59e0b",   // Amber
  no2: "#6366f1",  // Indigo
  so2: "#8b5cf6",  // Violet
  co: "#64748b",   // Slate
  nh3: "#ec4899",  // Pink
};

const PollutantChart = ({ data, pollutants, height = 450 }) => {
  return (
    <div className="chart-container-minimal" style={{ width: '100%', height: height, padding: '24px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            {pollutants.map((key) => (
              <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={palette[key]} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={palette[key]} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--text-muted)", fontSize: 12, fontWeight: 500 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--text-muted)", fontSize: 12, fontWeight: 500 }} 
            domain={[0, (dataMax) => {
              if (!dataMax || dataMax === 0) return 10;
              const margin = dataMax * 0.15;
              const upper = dataMax + margin;
              return upper < 10 ? Math.ceil(upper * 10) / 10 : Math.ceil(upper);
            }]}
            tickFormatter={(val) => (val % 1 !== 0 ? val.toFixed(1) : val)}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "var(--bg-card)", 
              border: "1px solid var(--border)", 
              borderRadius: "8px",
              boxShadow: "var(--shadow-md)",
              color: "var(--text-main)"
            }}
            itemStyle={{ fontSize: 13, fontWeight: 600 }}
            formatter={(value, name) => [
              typeof value === 'number' ? (value % 1 !== 0 ? value.toFixed(2) : value) : value,
              name
            ]}
          />
          <Legend 
            verticalAlign="top" 
            height={40} 
            iconType="circle"
            wrapperStyle={{ fontSize: 12, fontWeight: 600, color: "var(--primary)" }}
          />
          {pollutants.map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={labelMap[key]}
              stroke={palette[key]}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#grad-${key})`}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PollutantChart;

