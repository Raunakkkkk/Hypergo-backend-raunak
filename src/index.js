require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const Redis = require("redis");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();

// Rate limiting middleware
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Apply rate limiting to routes
app.use("/api/auth", authLimiter);
app.use("/api/properties", publicLimiter);
app.use("/api/favorites", authLimiter);
app.use("/api/recommendations", authLimiter);

// Redis client setup
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.connect();

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/hypergo")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Welcome page route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "welcome.html"));
});

// API Testing Interface route
app.get("/api-test", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "api-test.html"));
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/properties", require("./routes/properties"));
app.use("/api/favorites", require("./routes/favorites"));
app.use("/api/recommendations", require("./routes/recommendations"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    res.status(404).json({
      status: "error",
      message: "API endpoint not found",
    });
  } else {
    res.status(404).sendFile(path.join(__dirname, "public", "welcome.html"));
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Welcome page: http://localhost:${PORT}`);
  console.log(`API Testing Interface: http://localhost:${PORT}/api-test`);
});
