
const authenticateUser = require("../middleware/authenticateUser");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();


// =====================================
// REGISTER
// =====================================

router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email or username is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name: name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Account created successfully!",
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email or username is already registered.",
      });
    }

    console.error(error);

    res.status(500).json({
      message: "Registration failed.",
    });
  }
});

// =====================================
// LOGIN
// =====================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Login failed.",
    });
  }
});

// =====================================
// GET LOGGED-IN USER PROFILE
// =====================================

router.get("/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json({ user });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not retrieve profile.",
    });
  }
});

// =====================================
// UPDATE LOGGED-IN USER PROFILE
// =====================================

router.patch("/me", authenticateUser, async (req, res) => {
  try {
    const { name, bio, profileImage } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Name cannot be empty.",
        });
      }

      updates.name = name.trim();
    }

    if (bio !== undefined) {
      if (typeof bio !== "string" || bio.length > 300) {
        return res.status(400).json({
          message: "Bio must be 300 characters or fewer.",
        });
      }

      updates.bio = bio.trim();
    }

    if (profileImage !== undefined) {
      if (typeof profileImage !== "string") {
        return res.status(400).json({
          message: "Invalid profile image.",
        });
      }

      updates.profileImage = profileImage.trim();
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json({
      message: "Profile updated successfully!",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not update profile.",
    });
  }
});

// =====================================
// GET ANOTHER USER'S PUBLIC PROFILE
// =====================================

router.get("/users/:username", async (req, res) => {
  try {
    const normalizedUsername = req.params.username
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      username: normalizedUsername,
    }).select("name username bio profileImage");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json({ user });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not retrieve user profile.",
    });
  }
});

module.exports = router;
