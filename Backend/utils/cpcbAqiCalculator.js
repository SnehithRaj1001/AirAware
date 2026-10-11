/**
 * Central Pollution Control Board (CPCB) National Air Quality Index (NAQI) Breakpoints Calculator
 * 
 * Implements the official Indian CPCB linear interpolation formula:
 *   Ip = [ (I_Hi - I_Lo) / (B_Hi - B_Lo) ] * (Cp - B_Lo) + I_Lo
 * 
 * Where:
 *   Ip   = Sub-index for pollutant p
 *   Cp   = Concentration of pollutant p
 *   B_Hi = Breakpoint concentration greater than or equal to Cp
 *   B_Lo = Breakpoint concentration less than or equal to Cp
 *   I_Hi = AQI value corresponding to B_Hi
 *   I_Lo = AQI value corresponding to B_Lo
 * 
 * Overall AQI = max(Sub-indices), requiring at least 3 pollutants monitored,
 * with at least one being PM2.5 or PM10 (as per CPCB guidelines).
 */

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
    // Standard CPCB CO is in mg/m3. 0-1, 1.1-2, 2.1-10, 10.1-17, 17.1-34, >34
    // If concentration in dataset is µg/m3 or mg/m3:
    // When CO > 50, it is typically reported in µg/m3, so divide by 1000
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

/**
 * Calculates pollutant sub-index based on concentration using CPCB breakpoints.
 */
export const calculateSubIndex = (pollutant, rawConcentration) => {
  if (rawConcentration == null || isNaN(rawConcentration) || rawConcentration < 0) {
    return null;
  }

  let conc = Number(rawConcentration);
  const key = pollutant.toLowerCase().replace(/[\._\-]/g, "");

  // CO normalization if given in µg/m3 instead of mg/m3
  if (key === "co" && conc > 50) {
    conc = conc / 1000;
  }

  const lookupKey = key === "o3" ? "ozone" : key;
  const breaks = CPCB_BREAKPOINTS[lookupKey];
  if (!breaks) return null;

  for (const b of breaks) {
    if (conc <= b.bHi) {
      if (b.bHi === b.bLo) return b.iLo;
      const sub = ((b.iHi - b.iLo) / (b.bHi - b.bLo)) * (conc - b.bLo) + b.iLo;
      return Math.round(sub);
    }
  }

  // Value exceeds top breakpoint: linearly extrapolate or clamp to 500
  const top = breaks[breaks.length - 1];
  const extrapolated = ((top.iHi - top.iLo) / (top.bHi - top.bLo)) * (conc - top.bLo) + top.iLo;
  return Math.min(500, Math.round(extrapolated));
};

/**
 * Calculates composite CPCB NAQI from an object of pollutant concentrations.
 * Returns overall AQI, responsible prominent pollutant, and individual sub-indices.
 * 
 * Example input: { pm25: 90, pm10: 140, no2: 35, so2: 12, co: 0.8, ozone: 45, nh3: 110 }
 */
export const calculateCpcbAqi = (pollutants = {}) => {
  if (!pollutants || typeof pollutants !== "object") {
    return { aqi: 0, prominentPollutant: null, subIndices: {} };
  }

  const subIndices = {};
  let maxSubIndex = 0;
  let prominentPollutant = null;

  const validKeys = ["pm25", "pm10", "no2", "so2", "co", "ozone", "nh3"];

  for (const key of validKeys) {
    const val = pollutants[key] ?? pollutants[key.toUpperCase()] ?? (key === "ozone" ? pollutants.o3 : null);
    if (val != null) {
      const sub = calculateSubIndex(key, val);
      if (sub != null) {
        subIndices[key] = sub;
        if (sub > maxSubIndex) {
          maxSubIndex = sub;
          prominentPollutant = key;
        }
      }
    }
  }

  // Fallback: If only PM2.5 or PM10 exists
  const finalAqi = maxSubIndex > 0 ? maxSubIndex : 0;

  return {
    aqi: finalAqi,
    prominentPollutant,
    subIndices,
  };
};
