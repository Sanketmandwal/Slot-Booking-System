// Quick test script for booking API
const http = require("http");

const SLOT_ID = process.argv[2];
if (!SLOT_ID) {
  console.log("Usage: node test-book.js <SLOT_ID>");
  process.exit(1);
}

function bookSlot(userId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ userId });
    const options = {
      hostname: "localhost",
      port: 5000,
      path: `/api/slots/${SLOT_ID}/book`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        resolve({ status: res.statusCode, body: JSON.parse(body), userId });
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function testConcurrentBooking() {
  console.log(`\n🧪 Testing concurrent booking on slot: ${SLOT_ID}\n`);

  // First, get the slot info
  const slotInfo = await new Promise((resolve, reject) => {
    http.get(`http://localhost:5000/api/slots`, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        const slots = JSON.parse(body);
        const slot = slots.find((s) => s._id === SLOT_ID);
        resolve(slot);
      });
    }).on("error", reject);
  });

  if (!slotInfo) {
    console.log("❌ Slot not found!");
    process.exit(1);
  }

  console.log(`📋 Slot: "${slotInfo.title}"`);
  console.log(`📊 Capacity: ${slotInfo.remainingCapacity}/${slotInfo.totalCapacity}\n`);

  // Fire concurrent requests — more than the capacity
  const numRequests = slotInfo.remainingCapacity + 5;
  console.log(`🚀 Firing ${numRequests} concurrent booking requests...\n`);

  const promises = [];
  for (let i = 1; i <= numRequests; i++) {
    promises.push(bookSlot(`concurrent_user_${i}`));
  }

  const results = await Promise.all(promises);

  // Analyze results
  const successes = results.filter((r) => r.status === 201);
  const conflicts = results.filter((r) => r.status === 409);
  const others = results.filter((r) => r.status !== 201 && r.status !== 409);

  console.log("═══════════════════════════════════");
  console.log("RESULTS:");
  console.log("═══════════════════════════════════");
  results.forEach((r) => {
    const icon = r.status === 201 ? "✅" : "❌";
    console.log(`  ${icon} ${r.userId}: ${r.status} — ${r.body.message || r.body.error}`);
  });

  console.log("\n═══════════════════════════════════");
  console.log(`✅ Successful bookings: ${successes.length} (expected: ${slotInfo.remainingCapacity})`);
  console.log(`❌ Rejected (409):      ${conflicts.length} (expected: ${numRequests - slotInfo.remainingCapacity})`);
  if (others.length > 0) {
    console.log(`⚠️  Other errors:       ${others.length}`);
  }

  if (successes.length === slotInfo.remainingCapacity) {
    console.log("\n🎉 PASS — No overbooking! Atomic guard is working correctly.");
  } else {
    console.log(`\n💥 FAIL — Expected ${slotInfo.remainingCapacity} bookings but got ${successes.length}!`);
  }

  // Verify final slot state
  const finalSlot = await new Promise((resolve, reject) => {
    http.get(`http://localhost:5000/api/slots`, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        const slots = JSON.parse(body);
        resolve(slots.find((s) => s._id === SLOT_ID));
      });
    }).on("error", reject);
  });

  console.log(`\n📊 Final capacity: ${finalSlot.remainingCapacity}/${finalSlot.totalCapacity}`);
  if (finalSlot.remainingCapacity === 0) {
    console.log("✅ Remaining capacity is 0 — correct!\n");
  } else {
    console.log(`⚠️  Remaining capacity is ${finalSlot.remainingCapacity} — unexpected!\n`);
  }
}

testConcurrentBooking().catch(console.error);
