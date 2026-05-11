import {
  LineChart,
  Line,
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
};

const palette = {
  pm25: "#ff6b6b",
  pm10: "#4f46e5",
  o3: "#0ea5e9",
  no2: "#16a34a",
  so2: "#f59e0b",
  co: "#db2777",
};

const PollutantChart = ({ data, pollutants }) => {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="date" tick={{ fill: "#444" }} />
        <YAxis tick={{ fill: "#444" }} />
        <Tooltip />
        <Legend />
        {pollutants.map((key) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={labelMap[key]}
            stroke={palette[key]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PollutantChart;
