const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Slot title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Slot date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
    },
    totalCapacity: {
      type: Number,
      required: [true, "Total capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    remainingCapacity: {
      type: Number,
      required: true,
      min: [0, "Remaining capacity cannot be negative"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Slot", slotSchema);
