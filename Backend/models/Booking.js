const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: [true, "Slot reference is required"],
    },
    userId: {
      type: String,
      required: [true, "User ID is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

// Unique compound index — prevents the same user from booking the same slot twice.
// MongoDB enforces this at the database level, so even concurrent duplicate
// requests will fail with a duplicate key error (code 11000).
bookingSchema.index({ slot: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Booking", bookingSchema);
