import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";

// Load environment variables
dotenv.config();

const app = express();

// --------------------
// MIDDLEWARE
// --------------------
app.use(cors());
app.use(express.json());

// --------------------
// BASE ROUTE (Health Check)
// --------------------
app.get("/", (req, res) => {
  res.send("🚀 DelayShield AI Backend Running");
});

// --------------------
// API ROUTES
// --------------------
app.use("/api", routes);

// --------------------
// 404 HANDLER
// --------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// --------------------
// GLOBAL ERROR HANDLER (optional but pro)
// --------------------
app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

export default app;