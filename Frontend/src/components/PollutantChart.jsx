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

const PollutantChart = ({ data, pollutants }) => {
  return (
    <div className="chart-container-minimal" style={{ width: '100%', height: 450, padding: '24px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: '#fff' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            {pollutants.map((key) => (
              <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={palette[key]} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={palette[key]} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#666", fontSize: 12, fontWeight: 500 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#666", fontSize: 12, fontWeight: 500 }} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#fff", 
              border: "1px solid #eee", 
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)" 
            }}
            itemStyle={{ fontSize: 13, fontWeight: 600 }}
          />
          <Legend 
            verticalAlign="top" 
            height={40} 
            iconType="circle"
            wrapperStyle={{ fontSize: 12, fontWeight: 600, color: "#333" }}
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

