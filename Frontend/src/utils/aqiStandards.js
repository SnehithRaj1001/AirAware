/**
 * Centralized Indian National Air Quality Index (NAQI) Standard Definitions
 * 
 * Standard NAQI Bands:
 *   - Good (0–50): Minimal impact on health (#10b981)
 *   - Satisfactory (51–100): Minor breathing discomfort to sensitive people (#84cc16)
 *   - Moderate (101–200): Breathing discomfort to people with asthma/heart disease (#f59e0b)
 *   - Poor (201–300): Breathing discomfort to most people on prolonged exposure (#f97316)
 *   - Very Poor (301–400): Respiratory illness on prolonged exposure (#ef4444)
 *   - Severe (401+): Affects healthy people, serious impacts on patients (#7f1d1d)
 */

export const INDIAN_AQI_BANDS = [
  {
    min: 0,
    max: 50,
    label: "Good",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.35)",
    className: "level-good",
    desc: "Minimal impact on health",
  },
  {
    min: 51,
    max: 100,
    label: "Satisfactory",
    color: "#84cc16",
    bg: "rgba(132, 204, 22, 0.12)",
    border: "rgba(132, 204, 22, 0.35)",
    className: "level-satisfactory",
    desc: "Minor breathing discomfort to sensitive people",
  },
  {
    min: 101,
    max: 200,
    label: "Moderate",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.35)",
    className: "level-moderate",
    desc: "Breathing discomfort to people with asthma and heart disease",
  },
  {
    min: 201,
    max: 300,
    label: "Poor",
    color: "#f97316",
    bg: "rgba(249, 115, 22, 0.12)",
    border: "rgba(249, 115, 22, 0.35)",
    className: "level-poor",
    desc: "Breathing discomfort to most people on prolonged exposure",
  },
  {
    min: 301,
    max: 400,
    label: "Very Poor",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.35)",
    className: "level-very-poor",
    desc: "Respiratory illness on prolonged exposure",
  },
  {
    min: 401,
    max: Infinity,
    label: "Severe",
    color: "#7f1d1d",
    bg: "rgba(127, 29, 29, 0.2)",
    border: "rgba(127, 29, 29, 0.4)",
    className: "level-severe",
    desc: "Affects healthy people and seriously impacts those with existing ailments",
  },
];

/**
 * Returns complete band metadata for a given AQI value
 */
export const getIndianAqiBand = (aqi) => {
  if (aqi == null || isNaN(aqi)) {
    return {
      label: "Unknown",
      color: "#94a3b8",
      bg: "rgba(148, 163, 184, 0.12)",
      border: "rgba(148, 163, 184, 0.3)",
      className: "level-unknown",
      desc: "No data available",
    };
  }

  const val = Math.round(Number(aqi));
  if (val <= 50) return INDIAN_AQI_BANDS[0];
  if (val <= 100) return INDIAN_AQI_BANDS[1];
  if (val <= 200) return INDIAN_AQI_BANDS[2];
  if (val <= 300) return INDIAN_AQI_BANDS[3];
  if (val <= 400) return INDIAN_AQI_BANDS[4];
  return INDIAN_AQI_BANDS[5];
};

/**
 * Convenience color getter
 */
export const getIndianAqiColor = (aqi) => {
  return getIndianAqiBand(aqi).color;
};

/**
 * Convenience label getter
 */
export const getIndianAqiLabel = (aqi) => {
  return getIndianAqiBand(aqi).label;
};

export const CPCB_BREAKPOINTS = {
  pm25: [
    { bLo: 0, bHi: 30, iLo: 0, iHi: 50 },
    { bLo: 30, bHi: 60, iLo: 51, iHi: 100 },
    { bLo: 60, bHi: 90, iLo: 101, iHi: 200 },
    { bLo: 90, bHi: 120, iLo: 201, iHi: 300 },
    { bLo: 120, bHi: 250, iLo: 301, iHi: 400 },
    { bLo: 250, bHi: 500, iLo: 401, iHi: 500 },
  ],
  pm10: [
    { bLo: 0, bHi: 50, iLo: 0, iHi: 50 },
    { bLo: 50, bHi: 100, iLo: 51, iHi: 100 },
    { bLo: 100, bHi: 250, iLo: 101, iHi: 200 },
    { bLo: 250, bHi: 350, iLo: 201, iHi: 300 },
    { bLo: 350, bHi: 430, iLo: 301, iHi: 400 },
    { bLo: 430, bHi: 600, iLo: 401, iHi: 500 },
  ],
  no2: [
    { bLo: 0, bHi: 40, iLo: 0, iHi: 50 },
    { bLo: 40, bHi: 80, iLo: 51, iHi: 100 },
    { bLo: 80, bHi: 180, iLo: 101, iHi: 200 },
    { bLo: 180, bHi: 280, iLo: 201, iHi: 300 },
    { bLo: 280, bHi: 400, iLo: 301, iHi: 400 },
    { bLo: 400, bHi: 800, iLo: 401, iHi: 500 },
  ],
  so2: [
    { bLo: 0, bHi: 40, iLo: 0, iHi: 50 },
    { bLo: 40, bHi: 80, iLo: 51, iHi: 100 },
    { bLo: 80, bHi: 380, iLo: 101, iHi: 200 },
    { bLo: 380, bHi: 800, iLo: 201, iHi: 300 },
    { bLo: 800, bHi: 1600, iLo: 301, iHi: 400 },
    { bLo: 1600, bHi: 2400, iLo: 401, iHi: 500 },
  ],
  co: [
    { bLo: 0, bHi: 1.0, iLo: 0, iHi: 50 },
    { bLo: 1.0, bHi: 2.0, iLo: 51, iHi: 100 },
    { bLo: 2.0, bHi: 10.0, iLo: 101, iHi: 200 },
    { bLo: 10.0, bHi: 17.0, iLo: 201, iHi: 300 },
    { bLo: 17.0, bHi: 34.0, iLo: 301, iHi: 400 },
    { bLo: 34.0, bHi: 50.0, iLo: 401, iHi: 500 },
  ],
  ozone: [
    { bLo: 0, bHi: 50, iLo: 0, iHi: 50 },
    { bLo: 50, bHi: 100, iLo: 51, iHi: 100 },
    { bLo: 100, bHi: 168, iLo: 101, iHi: 200 },
    { bLo: 168, bHi: 208, iLo: 201, iHi: 300 },
    { bLo: 208, bHi: 748, iLo: 301, iHi: 400 },
    { bLo: 748, bHi: 1000, iLo: 401, iHi: 500 },
  ],
  nh3: [
    { bLo: 0, bHi: 200, iLo: 0, iHi: 50 },
    { bLo: 200, bHi: 400, iLo: 51, iHi: 100 },
    { bLo: 400, bHi: 800, iLo: 101, iHi: 200 },
    { bLo: 800, bHi: 1200, iLo: 201, iHi: 300 },
    { bLo: 1200, bHi: 1800, iLo: 301, iHi: 400 },
    { bLo: 1800, bHi: 2400, iLo: 401, iHi: 500 },
  ],
};

export const calculateSubIndex = (pollutant, rawConcentration) => {
  if (rawConcentration == null || isNaN(rawConcentration) || rawConcentration < 0) return null;
  let conc = Number(rawConcentration);
  const key = pollutant.toLowerCase().replace(/[\._\-]/g, "");
  if (key === "co" && conc > 50) conc = conc / 1000;
  const lookupKey = key === "o3" ? "ozone" : key;
  const breaks = CPCB_BREAKPOINTS[lookupKey];
  if (!breaks) return null;

  for (const b of breaks) {
    if (conc <= b.bHi) {
      if (b.bHi === b.bLo) return b.iLo;
      return Math.round(((b.iHi - b.iLo) / (b.bHi - b.bLo)) * (conc - b.bLo) + b.iLo);
    }
  }
  const top = breaks[breaks.length - 1];
  return Math.min(500, Math.round(((top.iHi - top.iLo) / (top.bHi - top.bLo)) * (conc - top.bLo) + top.iLo));
};

export const calculateCpcbAqi = (pollutants = {}) => {
  if (!pollutants || typeof pollutants !== "object") return { aqi: 0, prominentPollutant: null };
  let maxSub = 0;
  let prominent = null;
  const keys = ["pm25", "pm10", "no2", "so2", "co", "ozone", "nh3"];
  for (const key of keys) {
    const val = pollutants[key] ?? pollutants[key.toUpperCase()] ?? (key === "ozone" ? (pollutants.o3 ?? pollutants.o3_ppm) : null);
    if (val != null) {
      const sub = calculateSubIndex(key, val);
      if (sub != null && sub > maxSub) {
        maxSub = sub;
        prominent = key;
      }
    }
  }
  return { aqi: maxSub, prominentPollutant: prominent };
};
