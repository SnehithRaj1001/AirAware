import db from "../db.js";

export const findUserByUsername = async (username) => {
  const result = await db.query(
    "SELECT id, first_name, last_name, username, email, password, location, created_at FROM users WHERE username = $1",
    [username],
  );
  return result.rows[0];
};

export const findUserById = async (userId) => {
  const result = await db.query(
    "SELECT id, first_name, last_name, username, email, location, created_at FROM users WHERE id = $1",
    [userId],
  );
  return result.rows[0];
};

export const createUser = async (
  firstName,
  lastName,
  username,
  email,
  password,
  location,
) => {
  const result = await db.query(
    "INSERT INTO users (first_name, last_name, username, email, password, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, first_name, last_name, username, email, location, created_at",
    [firstName, lastName, username, email, password, location],
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
