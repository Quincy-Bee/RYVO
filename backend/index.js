
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const app = express();

app.use(cors());
app.use(express.json());

// Cache the MongoDB connection between serverless invocations.
let mongoConnectionPromise = null;

const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured.");
  }

  // Reset a stale connection promise if MongoDB disconnected.
  if (mongoose.connection.readyState === 0) {
    mongoConnectionPromise = null;
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      })
      .catch((error) => {
        mongoConnectionPromise = null;
        throw error;
      });
  }

  await mongoConnectionPromise;
};

// Ensure MongoDB is connected before handling API requests.
app.use("/api", async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);

    return res.status(500).json({
      message: "Database connection failed.",
    });
  }
});

// Authentication routes
app.use("/api/auth", require("./routes/auth"));

// Video routes
app.use("/api/videos", require("./routes/videos"));

app.get("/", (req, res) => {
  res.send("RYVO API is running!");
});

// Export Express application for Vercel.
// Do not call app.listen() here.
module.exports = app;
