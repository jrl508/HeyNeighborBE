const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const toolRoutes = require("./routes/toolRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const localBusinessRoutes = require("./routes/localBusinessRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { initSocket } = require("./socket");
const path = require("path");
const app = express();
const server = http.createServer(app);

dotenv.config();

const PORT = process.env.PORT || 3001;

// Initialize Socket.io
initSocket(server);

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

// Serve the uploads folder as static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Stripe webhook requires raw body for signature verification
// We must use express.json() for all routes EXCEPT the webhook
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tools", toolRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/local-businesses", localBusinessRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/messaging", messageRoutes);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
