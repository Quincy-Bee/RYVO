
const User = require("../models/User");

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("role");

    if (!user) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Administrator access required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin authorization error:", error);

    return res.status(500).json({
      message: "Could not verify administrator permissions.",
    });
  }
};

module.exports = requireAdmin;
