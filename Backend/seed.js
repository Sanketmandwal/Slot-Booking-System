require("dotenv").config();
const mongoose = require("mongoose");
const Slot = require("./models/Slot");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/slot-booking";

const sampleSlots = [
  {
    title: "React Fundamentals Workshop",
    description: "Deep dive into React hooks, state management, and component patterns.",
    date: new Date("2026-07-20"),
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    totalCapacity: 5,
    remainingCapacity: 5,
  },
  {
    title: "MongoDB Masterclass",
    description: "Learn aggregation pipelines, indexing strategies, and atomic operations.",
    date: new Date("2026-07-20"),
    startTime: "2:00 PM",
    endTime: "4:00 PM",
    totalCapacity: 3,
    remainingCapacity: 3,
  },
  {
    title: "Node.js Performance Tuning",
    description: "Optimize your Node.js applications for production workloads.",
    date: new Date("2026-07-21"),
    startTime: "9:00 AM",
    endTime: "11:00 AM",
    totalCapacity: 8,
    remainingCapacity: 8,
  },
  {
    title: "System Design for Beginners",
    description: "Scaling strategies, load balancing, and database design fundamentals.",
    date: new Date("2026-07-21"),
    startTime: "1:00 PM",
    endTime: "3:30 PM",
    totalCapacity: 12,
    remainingCapacity: 12,
  },
  {
    title: "Express.js API Design",
    description: "RESTful patterns, middleware design, and error handling best practices.",
    date: new Date("2026-07-22"),
    startTime: "10:00 AM",
    endTime: "11:30 AM",
    totalCapacity: 2,
    remainingCapacity: 2,
  },
  {
    title: "JavaScript Concurrency Deep Dive",
    description: "Event loop, promises, async/await, and race condition patterns.",
    date: new Date("2026-07-22"),
    startTime: "3:00 PM",
    endTime: "5:00 PM",
    totalCapacity: 15,
    remainingCapacity: 15,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Slot.deleteMany({});
    console.log("🗑️  Cleared existing slots");

    // Insert sample slots
    const created = await Slot.insertMany(sampleSlots);
    console.log(`🌱 Seeded ${created.length} slots:`);
    created.forEach((slot) => {
      console.log(`   • ${slot.title} (capacity: ${slot.totalCapacity})`);
    });

    await mongoose.disconnect();
    console.log("\n✅ Seed complete. Run 'node index.js' to start the server.");
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
}

seed();
