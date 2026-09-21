import db from "../db.js";

async function runMigration() {
  try {
    console.log("Running migration for Option B...");

    // 1. Alter users table
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS age INTEGER,
      ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
      ADD COLUMN IF NOT EXISTS health_conditions TEXT[],
      ADD COLUMN IF NOT EXISTS smoking_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS activity_level VARCHAR(50),
      ADD COLUMN IF NOT EXISTS symptom_sensitivity VARCHAR(50);
    `);
    console.log("Successfully altered 'users' table.");

    // 2. Create user_symptom_logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_symptom_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        medication_taken BOOLEAN DEFAULT FALSE,
        symptoms_logged TEXT[],
        symptom_severity VARCHAR(50),
        outdoor_time_hours DECIMAL(4, 1),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Successfully created/verified 'user_symptom_logs' table.");

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
