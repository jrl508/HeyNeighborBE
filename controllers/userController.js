const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { validationResult } = require("express-validator"); // For input validation
const { uploadSingle } = require("../middleware/fileUploadMiddleware");
const { use } = require("../routes/authRoutes");
// Register User
const registerUser = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, first_name, last_name, phone_number, password, location } =
    req.body;

  try {
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
      location,
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
    const { first_name, last_name, profile_image, phone_number, location } =
      user;
    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        email,
        first_name,
        last_name,
        profile_image,
        phone_number,
        location,
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
    const { user } = req.body;
    const updatedUser = await User.updateUserProfile(userId, user);
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
  uploadSingle(req, res, async (err) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      console.log("Failed 2");
      return res.status(400).json({ message: "No File Uploaded" });
    }

    const userId = req.params.id;
    const profileImagePath = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    try {
      const updatedUser = await User.updateUserProfilePicture(
        userId,
        profileImagePath
      );
      res.status(200).json({
        message: "Profile image uploaded successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating profile image" });
    }
  });
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
