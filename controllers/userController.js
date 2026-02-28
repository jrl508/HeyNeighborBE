const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { validationResult } = require("express-validator"); // For input validation
const { uploadSingle } = require("../middleware/fileUploadMiddleware");
const { use } = require("../routes/authRoutes");
const { requireZipOrThrow } = require("../utils/zipHelper.js");

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
      password_digest: hashedPassword,
      zip_code: zip,
      lat,
      lng,
      city,
      state,
    });

    // Return the user (excluding password) and a success message
    const user = newUser[0];
    const { password_digest, ...userWithoutPassword } = user;

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
      zip_code,
      lat,
      lng,
      city,
      state,
      average_rating,
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
        zip_code,
        lat,
        lng,
        city,
        state,
        average_rating,
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
  const profileImagePath = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;

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

module.exports = {
  registerUser,
  loginUser,
  uploadProfilePic,
  getUserById,
  updateUser,
};
