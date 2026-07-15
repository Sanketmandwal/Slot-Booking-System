const Booking = require("../models/Booking");


const getUserBookings = async (req, res) => {
  const { userId } = req.query;

  if (!userId || typeof userId !== "string" || !userId.trim()) {
    return res.status(400).json({ error: "userId query parameter is required" });
  }

  try {
    const bookings = await Booking.find({ userId: userId.trim() })
      .populate("slot")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

module.exports = { getUserBookings };
