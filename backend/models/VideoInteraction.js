
const mongoose = require("mongoose");

const videoInteractionSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    liked: {
      type: Boolean,
      default: false,
    },

    saved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Each user can have one interaction record per video.
videoInteractionSchema.index(
  { video: 1, user: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "VideoInteraction",
  videoInteractionSchema
);
