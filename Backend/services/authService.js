import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { findUserByUsername, findUserById, createUser, createSymptomLog, updateUserProfile, getUserSymptomLogs } from "../repositories/userRepository.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

export const loginUser = async (username, password) => {
  const user = await findUserByUsername(username);
  
  if (!user) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  // Compare passwords
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      location: user.location,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  return {
    token,
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      email: user.email,
      location: user.location,
      age: user.age,
      gender: user.gender,
      healthConditions: user.health_conditions,
      smokingStatus: user.smoking_status,
      activityLevel: user.activity_level,
      symptomSensitivity: user.symptom_sensitivity,
    },
  };
};

export const registerUser = async ({
  firstName,
  lastName,
  username,
  email,
  password,
  location,
  age,
  gender,
  healthConditions,
  smokingStatus,
  activityLevel,
  symptomSensitivity,
  // Initial symptom log fields
  medicationTaken,
  symptomsLogged,
  symptomSeverity,
  outdoorTimeHours,
  notes,
}) => {
  const existingUser = await findUserByUsername(username);
  
  if (existingUser) {
    const error = new Error("Username already exists");
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await createUser({
    firstName,
    lastName,
    username,
    email,
    password: hashedPassword,
    location,
    age,
    gender,
    healthConditions,
    smokingStatus,
    activityLevel,
    symptomSensitivity,
    notes,
  });

  // If any symptom log info was provided during registration, create initial symptom log
  if (
    medicationTaken !== undefined ||
    (symptomsLogged && symptomsLogged.length > 0) ||
    symptomSeverity ||
    outdoorTimeHours !== undefined ||
    notes
  ) {
    try {
      await createSymptomLog({
        userId: newUser.id,
        medicationTaken: Boolean(medicationTaken),
        symptomsLogged: symptomsLogged || [],
        symptomSeverity: symptomSeverity || null,
        outdoorTimeHours: outdoorTimeHours || null,
        notes: notes || null,
      });
    } catch (logErr) {
      console.error("Error creating initial symptom log:", logErr);
    }
  }

  const token = jwt.sign(
    {
      id: newUser.id,
      username: newUser.username,
      location: newUser.location,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  return {
    token,
    user: {
      id: newUser.id,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      username: newUser.username,
      email: newUser.email,
      location: newUser.location,
      age: newUser.age,
      gender: newUser.gender,
      healthConditions: newUser.health_conditions,
      smokingStatus: newUser.smoking_status,
      activityLevel: newUser.activity_level,
      symptomSensitivity: newUser.symptom_sensitivity,
      notes: newUser.notes,
    },
  };
};

export const getUserProfile = async (userId) => {
  const user = await findUserById(userId);
  
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const logs = await getUserSymptomLogs(userId, 5);

  return {
    ...user,
    symptomLogs: logs,
  };
};

export const modifyUserProfile = async (userId, profileData) => {
  const updatedUser = await updateUserProfile(userId, profileData);
  
  if (!updatedUser) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const logs = await getUserSymptomLogs(userId, 5);

  return {
    ...updatedUser,
    symptomLogs: logs,
  };
};

