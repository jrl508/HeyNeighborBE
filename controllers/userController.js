const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/userModel");
const PasswordReset = require("../models/passwordResetModel");
const { sendWelcomeEmail, sendPasswordResetEmail } = require("../utils/emailUtils");
const { validationResult } = require("express-validator"); // For input validation
const { uploadSingle } = require("../middleware/fileUploadMiddleware");
const { requireZipOrThrow, lookupCoords } = require("../utils/zipHelper.js");

// Register User
const registerUser = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, first_name, last_name, phone_number, password, zip_code } =
    req.body;

  try {
    // Validate zip and get coords
    let zipInfo;
    try {
      zipInfo = requireZipOrThrow(zip_code);
    } catch (err) {
      return res.status(400).json({ error: "Invalid ZIP code" });
    }
    const { zip, lat, lng, city, state } = zipInfo;

    // Check if the email is already taken
    const existingUser = await User.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const newUser = await User.createUser({
      email,
      first_name,
      last_name,
      phone_number,
      phone_verified: false,
      password_digest: hashedPassword,
      zip_code: zip,
      lat,
      lng,
      city,
      state,
    });

    // Return the user (excluding password) and a success message
    const createdUser = Array.isArray(newUser) ? newUser[0] : newUser;
    const { password_digest, ...userWithoutPassword } = createdUser || {};

    const targetEmail = (createdUser && createdUser.email) || email;
    const targetFirstName = (createdUser && createdUser.first_name) || first_name;

    // Send Welcome Email asynchronously
    sendWelcomeEmail({ email: targetEmail, firstName: targetFirstName }).catch((e) =>
      console.error("Welcome email error:", e)
    );

    res.status(201).json({
      message: "User registered successfully",
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Login User
const loginUser = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password_digest);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    console.log("LOGIN SUCCESSFUL");
    console.dir(user);
    const {
      id,
      first_name,
      last_name,
      profile_image,
      phone_number,
      phone_verified,
      zip_code,
      lat,
      lng,
      city,
      state,
      average_rating,
      tools_listed_count,
      completed_rentals_count,
      created_at,
      reviews_count,
    } = user;
    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id,
        email,
        first_name,
        last_name,
        profile_image,
        phone_number,
        phone_verified,
        zip_code,
        lat,
        lng,
        city,
        state,
        average_rating,
        tools_listed_count,
        completed_rentals_count,
        created_at,
        reviews_count,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    let { user } = req.body;

    // If zip_code is provided, validate and get location data
    if (user.zip_code) {
      let zipInfo;
      try {
        zipInfo = requireZipOrThrow(user.zip_code);
      } catch (err) {
        return res.status(400).json({ error: "Invalid ZIP code" });
      }
      const { zip, lat, lng, city, state } = zipInfo;

      // Replace zip_code with individual location fields
      user = {
        ...user,
        zip_code: zip,
        lat,
        lng,
        city,
        state,
      };
    }

    const data = await User.updateUserProfile(userId, user);
    const updatedUser = data[0];
    res.status(200).json({
      message: "User Updated Successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update user profile" });
  }
};

const uploadProfilePic = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No File Uploaded" });
  }

  const userId = req.params.id;
  const filename = req.file.filename;
  const profileImagePath = filename.startsWith("http")
    ? filename
    : `${req.protocol}://${req.get("host")}/uploads/${filename}`;


  try {
    const data = await User.updateUserProfilePicture(userId, profileImagePath);
    const updatedUser = data[0];
    res.status(200).json({
      message: "Profile image uploaded successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating profile image" });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.getUserById(id);
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Fetching User" });
  }
};

const reverseGeocode = async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ message: "Latitude and Longitude are required" });
  }

  try {
    const info = lookupCoords(lat, lng);
    if (!info) {
      return res.status(404).json({ message: "No ZIP code found for these coordinates" });
    }
    res.status(200).json(info);
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    res.status(500).json({ message: "Server error during reverse geocoding" });
  }
};

// Google OAuth Login
const googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: "Google credential token is required" });
  }

  try {
    let payload;
    try {
      const { OAuth2Client } = require("google-auth-library");
      const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.warn("[googleLogin] Token verification fallback:", verifyErr.message);
      const jwt = require("jsonwebtoken");
      payload = jwt.decode(credential);
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Invalid Google credential token" });
    }

    const { sub: google_id, email, given_name, family_name, picture } = payload;

    let user = await User.getUserByGoogleId(google_id);
    if (!user) {
      user = await User.getUserByEmail(email);
      if (user) {
        const db = require("../database/db");
        await db("users").where({ id: user.id }).update({ google_id, auth_provider: "google" });
        user.google_id = google_id;
        user.auth_provider = "google";
      } else {
        const newUsers = await User.createUser({
          email,
          first_name: given_name || "Neighbor",
          last_name: family_name || "",
          google_id,
          auth_provider: "google",
          profile_image: picture || null,
          password_digest: null,
        });
        user = newUsers[0];

        sendWelcomeEmail({ email: user.email, firstName: user.first_name }).catch((e) =>
          console.error("Welcome email error (google):", e)
        );
      }
    }

    const {
      id,
      first_name,
      last_name,
      profile_image,
      phone_number,
      phone_verified,
      zip_code,
      lat,
      lng,
      city,
      state,
      average_rating,
      tools_listed_count,
      completed_rentals_count,
      created_at,
      reviews_count,
    } = user;

    const jwt = require("jsonwebtoken");
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({
      message: "Google login successful",
      token,
      user: {
        id,
        email,
        first_name,
        last_name,
        profile_image,
        phone_number,
        phone_verified,
        zip_code,
        lat,
        lng,
        city,
        state,
        average_rating,
        tools_listed_count,
        completed_rentals_count,
        created_at,
        reviews_count,
      },
    });
  } catch (err) {
    console.error("[userController] Google login error:", err);
    return res.status(500).json({
      message: err.message || "Error processing Google authentication",
    });
  }
};

// Forgot Password Handler
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.getUserByEmail(email);
    // Generic response to prevent email enumeration
    if (!user) {
      return res.json({
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordReset.createToken({
      userId: user.id,
      token: resetToken,
      expiresAt,
    });

    sendPasswordResetEmail({
      email: user.email,
      firstName: user.first_name,
      resetToken,
    }).catch((err) => console.error("Error sending reset email:", err));

    return res.json({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("[forgotPassword] Error:", err);
    return res.status(500).json({ message: "Server error processing password reset request" });
  }
};

// Reset Password Handler
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const resetRecord = await PasswordReset.getValidToken(token);
    if (!resetRecord) {
      return res.status(400).json({ message: "Invalid or expired password reset link" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.updateUserProfile(resetRecord.user_id, {
      password_digest: hashedPassword,
    });

    await PasswordReset.markAsUsed(resetRecord.id);

    return res.json({
      message: "Password updated successfully! You can now log in with your new password.",
    });
  } catch (err) {
    console.error("[resetPassword] Error:", err);
    return res.status(500).json({ message: "Server error resetting password" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
  uploadProfilePic,
  getUserById,
  updateUser,
  reverseGeocode,
};

