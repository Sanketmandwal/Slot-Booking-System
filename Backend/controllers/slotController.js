const mongoose = require("mongoose");
const Slot = require("../models/Slot");
const Booking = require("../models/Booking");

const getAllSlots = async (req, res) => {
  try {
    const slots = await Slot.find().sort({ date: 1, startTime: 1 });
    res.json(slots);
  } catch (err) {
    console.error("Error fetching slots:", err);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
};


const bookSlot = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  // Input validation
  if (!userId || typeof userId !== "string" || !userId.trim()) {
    return res.status(400).json({ error: "userId is required and must be a non-empty string" });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid slot ID format" });
  }

  try {
    // ── Step 1: Atomic capacity check + decrement ──
    // This is the ONE operation that prevents all overbooking.
    // MongoDB guarantees findOneAndUpdate is atomic for a single document.
    // The condition { remainingCapacity: { $gt: 0 } } and the update
    // { $inc: { remainingCapacity: -1 } } happen as ONE indivisible step.
    const slot = await Slot.findOneAndUpdate(
      { _id: id, remainingCapacity: { $gt: 0 } },
      { $inc: { remainingCapacity: -1 } },
      { new: true }
    );

    // If null, either slot doesn't exist or it's full
    if (!slot) {
      // Check if the slot exists at all
      const exists = await Slot.findById(id);
      if (!exists) {
        return res.status(404).json({ error: "Slot not found" });
      }
      return res.status(409).json({ error: "Slot is full — no remaining capacity" });
    }

    // Step 2: Create the booking record
    try {
      const booking = await Booking.create({
        slot: id,
        userId: userId.trim(),
      });

      return res.status(201).json({
        message: "Booking successful",
        booking,
        slot,
      });
    } catch (bookingErr) {
      // Rollback: If booking creation fails, restore capacity
      await Slot.findByIdAndUpdate(id, { $inc: { remainingCapacity: 1 } });

      // Duplicate key error — user already booked this slot
      if (bookingErr.code === 11000) {
        return res.status(409).json({ error: "You have already booked this slot" });
      }

      throw bookingErr;
    }
  } catch (err) {
    console.error("Error booking slot:", err);
    res.status(500).json({ error: "Internal server error while booking" });
  }
};

module.exports = { getAllSlots, bookSlot };
