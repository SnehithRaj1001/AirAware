import db from "../db.js";

async function testProfileEndpoints() {
  const username = `profuser_${Date.now()}`;
  const email = `profuser_${Date.now()}@example.com`;

  try {
    // 1. Register a user
    const regRes = await fetch("http://localhost:4000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Doe",
        username,
        email,
        password: "Password123!",
        location: "Colaba, Mumbai",
        age: 30,
        gender: "Female",
        healthConditions: ["Asthma"],
        smokingStatus: "Non-smoker",
        activityLevel: "Lightly Active",
        symptomSensitivity: "Moderate",
        medicationTaken: true,
        symptomsLogged: ["Coughing"],
        symptomSeverity: { "Coughing": "Mild" },
        outdoorTimeHours: 1,
      }),
    });

    const regData = await regRes.json();
    console.log("Registered test user. Token received:", Boolean(regData.token));
    const token = regData.token;

    // 2. GET /auth/profile
    const getRes = await fetch("http://localhost:4000/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profile = await getRes.json();
    console.log("GET /auth/profile result:", {
      username: profile.username,
      age: profile.age,
      health_conditions: profile.health_conditions,
      symptomLogsCount: profile.symptomLogs?.length,
    });

    // 3. PUT /auth/profile
    const updateRes = await fetch("http://localhost:4000/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Smith",
        email,
        location: "Bandra, Mumbai",
        age: 31,
        gender: "Female",
        healthConditions: ["Asthma", "Allergies"],
        smokingStatus: "Former smoker",
        activityLevel: "Moderately Active",
        symptomSensitivity: "High",
      }),
    });

    const updated = await updateRes.json();
    console.log("PUT /auth/profile updated response:", {
      lastName: updated.last_name,
      location: updated.location,
      age: updated.age,
      health_conditions: updated.health_conditions,
      smoking_status: updated.smoking_status,
    });

    // Clean up
    await db.query("DELETE FROM users WHERE username = $1", [username]);
    console.log("Cleaned up test profile user.");
    process.exit(0);
  } catch (err) {
    console.error("Test profile endpoints failed:", err);
    process.exit(1);
  }
}

testProfileEndpoints();
