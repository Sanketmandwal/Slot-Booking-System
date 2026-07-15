const express = require("express");
const { getUserBookings } = require("../controllers/bookingController");

const router = express.Router();

// GET /api/bookings?userId= — Get bookings for a user
router.get("/", getUserBookings);

module.exports = router;
