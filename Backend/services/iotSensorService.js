const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  const table = process.env.SUPABASE_TABLE || "sensor_readings";
  return { url, key, table };
};

export const getLatestReading = async (deviceId = null) => {
  const { url: SUPABASE_URL, key: SUPABASE_SERVICE_ROLE_KEY, table: SUPABASE_TABLE } = getSupabaseConfig();
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase is not configured on the backend server. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY.");
  }

  const endpoint = new URL(`${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${SUPABASE_TABLE}`);
  endpoint.searchParams.set("select", "*");
  endpoint.searchParams.set("order", "recorded_at.desc");
  endpoint.searchParams.set("limit", "1");
  if (deviceId) {
    endpoint.searchParams.set("device_id", `eq.${deviceId}`);
  }

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    if (response.status === 404 || errorText.includes("relation") || errorText.includes("does not exist") || errorText.includes("not found")) {
      return null;
    }
    throw new Error(`Failed to fetch latest IoT reading from Supabase (${response.status}): ${errorText}`);
  }

  const rows = await response.json();
  return rows && rows.length > 0 ? rows[0] : null;
};

export const getReadingHistory = async ({ deviceId = null, limit = 60 } = {}) => {
  const { url: SUPABASE_URL, key: SUPABASE_SERVICE_ROLE_KEY, table: SUPABASE_TABLE } = getSupabaseConfig();
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase is not configured on the backend server.");
  }

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 60, 1), 500);
  const endpoint = new URL(`${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${SUPABASE_TABLE}`);
  endpoint.searchParams.set("select", "*");
  endpoint.searchParams.set("order", "recorded_at.desc");
  endpoint.searchParams.set("limit", safeLimit.toString());
  if (deviceId) {
    endpoint.searchParams.set("device_id", `eq.${deviceId}`);
  }

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    if (response.status === 404 || errorText.includes("relation") || errorText.includes("does not exist") || errorText.includes("not found")) {
      return [];
    }
    throw new Error(`Failed to fetch history from Supabase (${response.status}): ${errorText}`);
  }

  const rows = await response.json();
  // Return in chronological order for time-series charts
  return Array.isArray(rows) ? rows.reverse() : [];
};
