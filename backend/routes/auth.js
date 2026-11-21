
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticateUser = require("../middleware/authenticateUser");

const router = express.Router();

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

const normalizeUsername = (username) =>
  String(username || "").trim().replace(/^@/, "").toLowerCase();

const getPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  bio: user.bio || "",
  profileImage: user.profileImage || "",
  followersCount: user.followers?.length || 0,
  followingCount: user.following?.length || 0,
});

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        message: "Please provide your name, username, email, and password.",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = normalizeUsername(username);

    if (!normalizedEmail || !normalizedUsername) {
      return res.status(400).json({
        message: "Please provide a valid email and username.",
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        message:
          existingUser.email === normalizedEmail
            ? "An account with this email already exists."
            : "This username is already taken.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "That email or username is already in use.",
      });
    }

    return res.status(500).json({
      message: "Server error during registration.",
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: "Please provide your email and password.",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error during login.",
    });
  }
});

// GET LOGGED-IN USER
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Unable to retrieve profile.",
    });
  }
});

// UPDATE LOGGED-IN USER PROFILE
router.patch("/me", authenticateUser, async (req, res) => {
  try {
    const { name, bio, profileImage } = req.body;
    const updates = {};

    if (name !== undefined) {
      updates.name = String(name).trim();
    }

    if (bio !== undefined) {
      const normalizedBio = String(bio).trim();

      if (normalizedBio.length > 300) {
        return res.status(400).json({
          message: "Bio cannot exceed 300 characters.",
        });
      }

      updates.bio = normalizedBio;
    }

    if (profileImage !== undefined) {
      updates.profileImage = String(profileImage).trim();
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.json({
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Unable to update profile.",
    });
  }
});

// GET PUBLIC USER PROFILE
router.get("/users/:username", async (req, res) => {
  try {
    const username = normalizeUsername(req.params.username);

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.json({
      user: getPublicUser(user),
    });
  } catch (error) {
    console.error("Public profile error:", error);

    return res.status(500).json({
      message: "Unable to retrieve user profile.",
    });
  }
});

// GET FOLLOW STATUS FOR A PUBLIC PROFILE
router.get(
  "/users/:username/follow-status",
  authenticateUser,
  async (req, res) => {
    try {
      const username = normalizeUsername(req.params.username);

      const targetUser = await User.findOne({ username });

      if (!targetUser) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      const currentUser = await User.findById(req.userId);

      if (!currentUser) {
        return res.status(404).json({
          message: "Your account could not be found.",
        });
      }

      const isFollowing = currentUser.following.some(
        (id) => id.toString() === targetUser._id.toString()
      );

      return res.json({
        following: isFollowing,
        isOwnProfile:
          currentUser._id.toString() === targetUser._id.toString(),
        followersCount: targetUser.followers.length,
        followingCount: targetUser.following.length,
      });
    } catch (error) {
      console.error("Follow status error:", error);

      return res.status(500).json({
        message: "Unable to retrieve follow status.",
      });
    }
  }
);

// FOLLOW OR UNFOLLOW A USER
router.post(
  "/users/:username/follow",
  authenticateUser,
  async (req, res) => {
    try {
      const username = normalizeUsername(req.params.username);

      const targetUser = await User.findOne({ username });

      if (!targetUser) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (targetUser._id.toString() === req.userId.toString()) {
        return res.status(400).json({
          message: "You cannot follow yourself.",
        });
      }

      const currentUser = await User.findById(req.userId);

      if (!currentUser) {
        return res.status(404).json({
          message: "Your account could not be found.",
        });
      }

      const alreadyFollowing = currentUser.following.some(
        (id) => id.toString() === targetUser._id.toString()
      );

      if (alreadyFollowing) {
        // UNFOLLOW
        await Promise.all([
          User.updateOne(
            { _id: currentUser._id },
            { $pull: { following: targetUser._id } }
          ),
          User.updateOne(
            { _id: targetUser._id },
            { $pull: { followers: currentUser._id } }
          ),
        ]);
      } else {
        // FOLLOW
        await Promise.all([
          User.updateOne(
            { _id: currentUser._id },
            { $addToSet: { following: targetUser._id } }
          ),
          User.updateOne(
            { _id: targetUser._id },
            { $addToSet: { followers: currentUser._id } }
          ),
        ]);
      }

      const updatedTarget = await User.findById(targetUser._id);

      return res.json({
        following: !alreadyFollowing,
        followersCount: updatedTarget.followers.length,
        followingCount: updatedTarget.following.length,
        message: alreadyFollowing
          ? "You unfollowed this creator."
          : "You are now following this creator.",
      });
    } catch (error) {
      console.error("Follow/unfollow error:", error);

      return res.status(500).json({
        message: "Unable to update follow status.",
      });
    }
  }
);

module.exports = router;
