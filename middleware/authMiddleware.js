const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  // Extract the token from the Authorization header
  const token = req.header("Authorization")?.replace("Bearer ", "");

  console.log(
    "[authMiddleware] Authorization header:",
    req.header("Authorization"),
  );
  console.log(
    "[authMiddleware] Extracted token:",
    token ? "present" : "missing",
  );

  if (!token) {
    console.error("[authMiddleware] No token provided");
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add the decoded user data (userId) to the request object
    req.user = { id: decoded.userId };
    console.log("[authMiddleware] Token verified for userId:", decoded.userId);
    next(); // Proceed to the next middleware/controller
  } catch (err) {
    console.error("[authMiddleware] Token verification error:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authenticate;
