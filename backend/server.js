const express = require("express");
const { Pool } = require("pg");
const { createClient } = require("redis");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  port: 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "appdb",
});

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || "redis"}:6379`,
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

async function startServer() {
  await redisClient.connect();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      message TEXT NOT NULL
    )
  `);

  app.get("/", (req, res) => {
    res.json({
      message: "Backend is running!",
      postgres: "connected",
      redis: "connected",
    });
  });

  app.get("/api/message", async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM messages ORDER BY id DESC LIMIT 1"
    );

    res.json(result.rows[0] || { message: "No message found" });
  });

  app.post("/api/message", async (req, res) => {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    await pool.query("INSERT INTO messages (message) VALUES ($1)", [message]);

    await redisClient.set("latest_message", message);

    res.json({ message: "Saved successfully" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start backend:", err);
});
