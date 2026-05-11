import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { findUserByUsername, findUserById, createUser } from "../repositories/userRepository.js";

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
    },
  };
};

export const registerUser = async (firstName, lastName, username, email, password, location) => {
  const existingUser = await findUserByUsername(username);
  
  if (existingUser) {
    const error = new Error("Username already exists");
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await createUser(firstName, lastName, username, email, hashedPassword, location);

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

  return user;
};
