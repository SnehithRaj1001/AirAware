import "dotenv/config";
import bcrypt from "bcryptjs";
import db from "../db.js";

async function hashExistingPasswords() {
  try {
    console.log("Fetching users with plain text passwords...");
    
    // Get all users
    const result = await db.query("SELECT id, username, password FROM users");
    const users = result.rows;

    if (users.length === 0) {
      console.log("No users found in database.");
      process.exit(0);
    }

    console.log(`Found ${users.length} user(s). Processing...`);

    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (user.password.startsWith("$2")) {
        console.log(`✓ User "${user.username}" already has hashed password - skipping`);
        continue;
      }

      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Update the database
      await db.query("UPDATE users SET password = $1 WHERE id = $2", [
        hashedPassword,
        user.id,
      ]);

      console.log(`✓ User "${user.username}" password hashed successfully`);
    }

    console.log("\n✅ All passwords have been hashed!");
    process.exit(0);
  } catch (error) {
    console.error("Error hashing passwords:", error);
    process.exit(1);
  }
}

hashExistingPasswords();
