import { loginUser, registerUser, getUserProfile, modifyUserProfile } from "../services/authService.js";

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const result = await loginUser(username, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const {
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
      medicationTaken,
      symptomsLogged,
      symptomSeverity,
      outdoorTimeHours,
      notes,
    } = req.body;

    if (!firstName || !lastName || !username || !email || !password || !location) {
      return res.status(400).json({ error: "Basic registration fields are required" });
    }

    const result = await registerUser({
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
      medicationTaken,
      symptomsLogged,
      symptomSeverity,
      outdoorTimeHours,
      notes,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await getUserProfile(userId);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      email,
      location,
      age,
      gender,
      healthConditions,
      smokingStatus,
      activityLevel,
      symptomSensitivity,
      notes,
    } = req.body;

    const updatedUser = await modifyUserProfile(userId, {
      firstName,
      lastName,
      email,
      location,
      age,
      gender,
      healthConditions,
      smokingStatus,
      activityLevel,
      symptomSensitivity,
      notes,
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

