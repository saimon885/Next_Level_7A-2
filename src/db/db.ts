import { Pool } from "pg";
import config from "../config/config.js";

export const pool = new Pool({
  connectionString: config.connectionString,
});

export const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(15) DEFAULT 'contributor'
          CHECK (role IN ('maintainer', 'contributor')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL
         CHECK (LENGTH(TRIM(description)) >= 20),
        type VARCHAR(30) NOT NULL
         CHECK(type IN('bug', 'feature_request')),
        status VARCHAR(30) DEFAULT 'open' NOT NULL
         CHECK(status IN('open', 'in_progress', 'resolved')),
        reporter_id INTEGER NOT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        )`);

    console.log("Users table created successfully");
  } catch (error) {
    console.error("Database creation failed:", error);
  }
};
