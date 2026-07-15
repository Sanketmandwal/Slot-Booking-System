const express = require("express");
const { getAllSlots, bookSlot } = require("../controllers/slotController");

const router = express.Router();

// GET /api/slots — List all slots with remaining capacity
router.get("/", getAllSlots);

// POST /api/slots/:id/book — Book a slot (race-safe, atomic)
router.post("/:id/book", bookSlot);

module.exports = router;
