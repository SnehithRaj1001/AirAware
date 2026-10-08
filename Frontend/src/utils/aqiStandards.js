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
