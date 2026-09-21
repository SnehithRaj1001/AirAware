import db from "../db.js";

async function testRegistration() {
  const testUser = {
    firstName: "Test",
    lastName: "HealthUser",
    username: `testuser_${Date.now()}`,
    email: `testuser_${Date.now()}@example.com`,
    password: "Password123!",
    location: "Colaba, Mumbai",
    age: 29,
    gender: "Female",
    healthConditions: ["Asthma", "Allergies"],
    smokingStatus: "Non-smoker",
    activityLevel: "Moderately Active",
    symptomSensitivity: "High",
    medicationTaken: true,
    symptomsLogged: ["Coughing", "Throat irritation"],
    symptomSeverity: "Mild",
    outdoorTimeHours: 2,
    notes: "Doctor prescribed Salbutamol inhaler; use before morning runs when AQI > 100.",
  };

  try {
    console.log("Testing registration endpoint with payload...");
    const res = await fetch("http://localhost:4000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const data = await res.json();
    console.log("Registration API Status:", res.status);
    console.log("Response data:", data);
    if (!res.ok) {
      throw new Error(data.error || "Registration failed");
    }

    // Verify DB
    const userDb = await db.query("SELECT * FROM users WHERE username = $1", [testUser.username]);
    console.log("\nDB Verification for users table:");
    console.log(userDb.rows[0]);

    const logDb = await db.query("SELECT * FROM user_symptom_logs WHERE user_id = $1", [userDb.rows[0].id]);
    console.log("\nDB Verification for user_symptom_logs table:");
    console.log(logDb.rows[0]);

    // Cleanup test record
    await db.query("DELETE FROM users WHERE id = $1", [userDb.rows[0].id]);
    console.log("\nCleaned up test record.");
    process.exit(0);
  } catch (err) {
    console.error("Test registration error:", err.response?.data || err.message);
    process.exit(1);
  }
}

testRegistration();
