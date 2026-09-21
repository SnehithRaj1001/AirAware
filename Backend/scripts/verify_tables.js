import db from "../db.js";

async function verifyTables() {
  try {
    const userRes = await db.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
    );
    console.log("USERS TABLE COLUMNS:");
    userRes.rows.forEach((r) => console.log(` - ${r.column_name} (${r.data_type})`));

    const logRes = await db.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_symptom_logs' ORDER BY ordinal_position"
    );
    console.log("\nUSER_SYMPTOM_LOGS TABLE COLUMNS:");
    logRes.rows.forEach((r) => console.log(` - ${r.column_name} (${r.data_type})`));

    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
}

verifyTables();
