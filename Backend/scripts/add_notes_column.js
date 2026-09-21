import db from "../db.js";

async function addNotesColumn() {
  try {
    console.log("Adding notes column to users and user_symptom_logs...");

    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);
    console.log("Added 'notes' column to 'users' table.");

    await db.query(`
      ALTER TABLE user_symptom_logs 
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);
    console.log("Added 'notes' column to 'user_symptom_logs' table.");

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

addNotesColumn();
