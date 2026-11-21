
const express = require("express");
const Video = require("../models/Video");
const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// =====================================
// GET PUBLISHED VIDEOS (PUBLIC)
// =====================================

router.get("/", async (req, res) => {
  try {
    const videos = await Video.find({
      status: "published",
    })
      .select(
        "title artist artistUsername genre description videoUrl thumbnailUrl featured publishedAt createdAt"
      )
      .sort({
        publishedAt: -1,
        createdAt: -1,
      });

    res.json({ videos });
  } catch (error) {
    console.error("Public video retrieval error:", error);

    res.status(500).json({
      message: "Could not retrieve published videos.",
    });
  }
});

// =====================================
// GET ALL VIDEOS (ADMIN ONLY)
// =====================================

router.get(
  "/admin",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const videos = await Video.find()
        .sort({ createdAt: -1 });

      res.json({ videos });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not retrieve videos.",
      });
    }
  }
);

// =====================================
// ADD NEW VIDEO (ADMIN ONLY)
// =====================================

router.post(
  "/",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        title,
        artist,
        artistUsername,
        genre,
        description,
        videoUrl,
        thumbnailUrl,
      } = req.body;

      if (
        !title ||
        !artist ||
        !genre ||
        !videoUrl ||
        !thumbnailUrl
      ) {
        return res.status(400).json({
          message: "Please provide all required video information.",
        });
      }

      const video = await Video.create({
        title,
        artist,
        artistUsername,
        genre,
        description,
        videoUrl,
        thumbnailUrl,
        createdBy: req.userId,
      });

      res.status(201).json({
        message: "Video added successfully.",
        video,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not add video.",
      });
    }
  }
);

// =====================================
// EDIT VIDEO (ADMIN ONLY)
// =====================================

router.patch(
  "/:id",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const allowedFields = [
        "title",
        "artist",
        "artistUsername",
        "genre",
        "description",
        "videoUrl",
        "thumbnailUrl",
        "featured",
      ];

      const updates = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      const video = await Video.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!video) {
        return res.status(404).json({
          message: "Video not found.",
        });
      }

      res.json({
        message: "Video updated successfully.",
        video,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not update video.",
      });
    }
  }
);

// =====================================
// PUBLISH VIDEO (ADMIN ONLY)
// =====================================

router.patch(
  "/:id/publish",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const video = await Video.findByIdAndUpdate(
        req.params.id,
        {
          status: "published",
          publishedAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!video) {
        return res.status(404).json({
          message: "Video not found.",
        });
      }

      res.json({
        message: "Video published successfully.",
        video,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not publish video.",
      });
    }
  }
);

// =====================================
// UNPUBLISH VIDEO (ADMIN ONLY)
// =====================================

router.patch(
  "/:id/unpublish",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const video = await Video.findByIdAndUpdate(
        req.params.id,
        { status: "unpublished" },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!video) {
        return res.status(404).json({
          message: "Video not found.",
        });
      }

      res.json({
        message: "Video unpublished successfully.",
        video,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not unpublish video.",
      });
    }
  }
);

// =====================================
// DELETE VIDEO (ADMIN ONLY)
// =====================================

router.delete(
  "/:id",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const video = await Video.findByIdAndDelete(
        req.params.id
      );

      if (!video) {
        return res.status(404).json({
          message: "Video not found.",
        });
      }

      res.json({
        message: "Video deleted successfully.",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not delete video.",
      });
    }
  }
);

module.exports = router;
