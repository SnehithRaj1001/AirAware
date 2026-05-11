import { loginUser, registerUser, getUserProfile } from "../services/authService.js";

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
    const { firstName, lastName, username, email, password, location } = req.body;

    if (!firstName || !lastName || !username || !email || !password || !location) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await registerUser(firstName, lastName, username, email, password, location);
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
