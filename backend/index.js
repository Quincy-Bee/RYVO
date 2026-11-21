
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

// Authentication routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/videos", require("./routes/videos"));

app.get("/", (req, res) => {
  res.send("RYVO API is running!");
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    const PORT = process.env.PORT || 5001;

    app.listen(PORT, () => {
      console.log(`RYVO server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
