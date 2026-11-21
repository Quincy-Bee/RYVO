
const express = require("express");
const mongoose = require("mongoose");

const Video = require("../models/Video");
const Comment = require("../models/Comments");
const VideoInteraction = require("../models/VideoInteraction");

const authenticateUser = require("../middleware/authenticateUser");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

const isValidId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const getPublishedVideo = async (videoId) => {
  if (!isValidId(videoId)) {
    return null;
  }

  return Video.findOne({
    _id: videoId,
    status: "published",
  });
};

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
// GET VIDEO DETAILS (PUBLIC)
// =====================================

router.get("/:id", async (req, res) => {
  try {
    const video = await getPublishedVideo(req.params.id);

    if (!video) {
      return res.status(404).json({
        message: "Video not found.",
      });
    }

    res.json({ video });
  } catch (error) {
    console.error("Video detail retrieval error:", error);

    res.status(500).json({
      message: "Could not retrieve video.",
    });
  }
});

// =====================================
// GET VIDEO COMMENTS (PUBLIC)
// =====================================

router.get("/:id/comments", async (req, res) => {
  try {
    const video = await getPublishedVideo(req.params.id);

    if (!video) {
      return res.status(404).json({
        message: "Video not found.",
      });
    }

    const comments = await Comment.find({
      video: video._id,
    })
      .populate("user", "name username profileImage")
      .sort({ createdAt: -1 });

    res.json({ comments });
  } catch (error) {
    console.error("Comment retrieval error:", error);

    res.status(500).json({
      message: "Could not retrieve comments.",
    });
  }
});

// =====================================
// ADD COMMENT (LOGGED-IN USERS)
// =====================================

router.post(
  "/:id/comments",
  authenticateUser,
  async (req, res) => {
    try {
      const video = await getPublishedVideo(req.params.id);

      if (!video) {
        return res.status(404).json({
          message: "Video not found.",
        });
      }

      const text =
        typeof req.body.text === "string"
          ? req.body.text.trim()
          : "";

      if (!text) {
        return res.status(400).json({
          message: "Please enter a comment.",
        });
      }

      if (text.length > 1000) {
        return res.status(400).json({
          message: "Comments cannot exceed 1000 characters.",
        });
      }

      const comment = await Comment.create({
        video: video._id,
        user: req.userId,
        text,
      });

      await comment.populate(
        "user",
        "name username profileImage"
      );

      res.status(201).json({
        message: "Comment added successfully.",
        comment,
      });
    } catch (error) {
      console.error("Comment creation error:", error);

      res.status(500).json({
        message: "Could not add comment.",
      });
    }
  }
);

// =====================================
// GET VIDEO ENGAGEMENT (PUBLIC)
// =====================================

router.get("/:id/engagement", async (req, res) => {
  try {
    const video = await getPublishedVideo(req.params.id);

    if (!video) {
      return res.status(404).json({
        message: "Video not found.",
      });
    }

    const likes = await VideoInteraction.countDocuments({
      video: video._id,
      liked: true,
    });

    res.json({ likes });
  } catch (error) {
    console.error("Engagement retrieval error:", error);

    res.status(500).json({
      message: "Could not retrieve video engagement.",
    });
  }
});

// =====================================
// GET CURRENT USER INTERACTION
// =====================================

router.get(
  "/:id/interaction",
  authenticateUser,
  async (req, res) => {
    try {
      const video = await getPublishedVideo(req.params.id);

      if (!video) {
        return res.status(404).json({
          message: "Video not found.",
        });
      }

      const interaction = await VideoInteraction.findOne({
        video: video._id,
        user: req.userId,
      });

      res.json({
        liked: interaction?.liked || false,
        saved: interaction?.saved || false,
      });
    } catch (error) {
      console.error("User interaction retrieval error:", error);

      res.status(500).json({
        message: "Could not retrieve your video interaction.",
      });
    }
  }
);

// =====================================
// LIKE / UNLIKE VIDEO
// =====================================

router.post(
  "/:id/like",
  authenticateUser,
  async (req, res) => {
    try {
      const video = await getPublishedVideo(req.params.id);

      if (!video) {
        return res.status(404).json({
          message: "Video not found.",
        });
      }

      const existing = await VideoInteraction.findOne({
        video: video._id,
        user: req.userId,
      });

      const liked = !(existing?.liked || false);

      await VideoInteraction.findOneAndUpdate(
        {
          video: video._id,
          user: req.userId,
        },
        {
          $set: { liked },
          $setOnInsert: {
            video: video._id,
            user: req.userId,
            saved: false,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

      const likes = await VideoInteraction.countDocuments({
        video: video._id,
        liked: true,
      });

      res.json({
        liked,
        likes,
        message: liked
          ? "Video liked."
          : "Like removed.",
      });
    } catch (error) {
      console.error("Video like error:", error);

      res.status(500).json({
        message: "Could not update video like.",
      });
    }
  }
);

// =====================================
// SAVE / UNSAVE VIDEO
// =====================================

router.post(
  "/:id/save",
  authenticateUser,
  async (req, res) => {
    try {
      const video = await getPublishedVideo(req.params.id);

      if (!video) {
        return res.status(404).json({
          message: "Video not found.",
        });
      }

      const existing = await VideoInteraction.findOne({
        video: video._id,
        user: req.userId,
      });

      const saved = !(existing?.saved || false);

      await VideoInteraction.findOneAndUpdate(
        {
          video: video._id,
          user: req.userId,
        },
        {
          $set: { saved },
          $setOnInsert: {
            video: video._id,
            user: req.userId,
            liked: false,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

      res.json({
        saved,
        message: saved
          ? "Video saved."
          : "Video removed from saved videos.",
      });
    } catch (error) {
      console.error("Video save error:", error);

      res.status(500).json({
        message: "Could not update saved video.",
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
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid video ID.",
        });
      }

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
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid video ID.",
        });
      }

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
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid video ID.",
        });
      }

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
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid video ID.",
        });
      }

      const video = await Video.findByIdAndDelete(
        req.params.id
      );

      if (!video) {
        return res.status(404).json({
          message: "Video not found.",
        });
      }

      // Remove comments and interactions for this video.
      await Promise.all([
        Comment.deleteMany({ video: video._id }),
        VideoInteraction.deleteMany({
          video: video._id,
        }),
      ]);

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
