import db from "../db.js";

export const findUserByUsername = async (username) => {
  const result = await db.query(
    `SELECT id, first_name, last_name, username, email, password, location, age, gender, 
            health_conditions, smoking_status, activity_level, symptom_sensitivity, notes, created_at 
     FROM users WHERE username = $1`,
    [username],
  );
  return result.rows[0];
};

export const findUserById = async (userId) => {
  const result = await db.query(
    `SELECT id, first_name, last_name, username, email, location, age, gender, 
            health_conditions, smoking_status, activity_level, symptom_sensitivity, notes, created_at 
     FROM users WHERE id = $1`,
    [userId],
  );
  return result.rows[0];
};

export const createUser = async ({
  firstName,
  lastName,
  username,
  email,
  password,
  location,
  age = null,
  gender = null,
  healthConditions = [],
  smokingStatus = null,
  activityLevel = null,
  symptomSensitivity = null,
  notes = null,
}) => {
  const result = await db.query(
    `INSERT INTO users (
      first_name, last_name, username, email, password, location, 
      age, gender, health_conditions, smoking_status, activity_level, symptom_sensitivity, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
    RETURNING id, first_name, last_name, username, email, location, age, gender, health_conditions, smoking_status, activity_level, symptom_sensitivity, notes, created_at`,
    [
      firstName,
      lastName,
      username,
      email,
      password,
      location,
      age ? parseInt(age, 10) : null,
      gender,
      Array.isArray(healthConditions) ? healthConditions : [],
      smokingStatus,
      activityLevel,
      symptomSensitivity,
      notes,
    ],
  );
  return result.rows[0];
};

export const createSymptomLog = async ({
  userId,
  medicationTaken = false,
  symptomsLogged = [],
  symptomSeverity = null,
  outdoorTimeHours = null,
  notes = null,
  timestamp = new Date(),
}) => {
  const result = await db.query(
    `INSERT INTO user_symptom_logs (
      user_id, medication_taken, symptoms_logged, symptom_severity, outdoor_time_hours, notes, timestamp
    ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING id, user_id, medication_taken, symptoms_logged, symptom_severity, outdoor_time_hours, notes, timestamp`,
    [
      userId,
      Boolean(medicationTaken),
      Array.isArray(symptomsLogged) ? symptomsLogged : [],
      typeof symptomSeverity === "object" && symptomSeverity !== null
        ? JSON.stringify(symptomSeverity)
        : symptomSeverity,
      outdoorTimeHours != null && outdoorTimeHours !== "" ? parseFloat(outdoorTimeHours) : null,
      notes,
      timestamp,
    ],
  );
  return result.rows[0];
};

export const updateUserLocation = async (userId, location) => {
  const result = await db.query(
    "UPDATE users SET location = $1 WHERE id = $2 RETURNING id, first_name, last_name, username, email, location, created_at",
    [location, userId],
  );
  return result.rows[0];
};

export const updateUserProfile = async (userId, {
  firstName,
  lastName,
  email,
  location,
  age = null,
  gender = null,
  healthConditions = [],
  smokingStatus = null,
  activityLevel = null,
  symptomSensitivity = null,
  notes = null,
}) => {
  const result = await db.query(
    `UPDATE users SET
      first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      email = COALESCE($3, email),
      location = COALESCE($4, location),
      age = $5,
      gender = $6,
      health_conditions = $7,
      smoking_status = $8,
      activity_level = $9,
      symptom_sensitivity = $10,
      notes = $11
    WHERE id = $12
    RETURNING id, first_name, last_name, username, email, location, age, gender, health_conditions, smoking_status, activity_level, symptom_sensitivity, notes, created_at`,
    [
      firstName,
      lastName,
      email,
      location,
      age ? parseInt(age, 10) : null,
      gender,
      Array.isArray(healthConditions) ? healthConditions : [],
      smokingStatus,
      activityLevel,
      symptomSensitivity,
      notes,
      userId,
    ],
  );
  return result.rows[0];
};

export const getUserSymptomLogs = async (userId, limit = 5) => {
  const result = await db.query(
    `SELECT id, user_id, medication_taken, symptoms_logged, symptom_severity, outdoor_time_hours, notes, timestamp
     FROM user_symptom_logs
     WHERE user_id = $1
     ORDER BY timestamp DESC
     LIMIT $2`,
    [userId, limit],
  );
  return result.rows;
};


