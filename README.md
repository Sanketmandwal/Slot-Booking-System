# Slot Booking System

A race-safe slot booking system built with the MERN stack (MongoDB, Express, React, Node.js). Users can book limited-capacity event slots with **guaranteed protection against overbooking**, even under concurrent requests.

---

## 1. How exactly did you prevent double-booking?

**Mechanism: MongoDB's atomic `findOneAndUpdate` with a capacity condition + `$inc`.**

The booking endpoint uses a single atomic operation:

```javascript
const slot = await Slot.findOneAndUpdate(
  { _id: id, remainingCapacity: { $gt: 0 } },   // condition: only if seats remain
  { $inc: { remainingCapacity: -1 } },            // atomically decrement
  { new: true }
);
```

**Why this is race-safe:**
- `findOneAndUpdate` is a single atomic document-level operation in MongoDB. The query condition (`remainingCapacity > 0`) and the update (`$inc: -1`) execute as **one indivisible step**.
- MongoDB acquires a write lock on the document. If two requests arrive in the same millisecond for the last seat, they are serialized — only one sees `remainingCapacity > 0` and succeeds. The other gets `null` back and receives a `409 Conflict`.
- There is **no "read → check → save" gap** that concurrent requests could exploit.

**Additional safeguard — Unique compound index:**
```javascript
bookingSchema.index({ slot: 1, userId: 1 }, { unique: true });
```
This prevents the same user from booking the same slot twice, enforced at the database level. If a duplicate occurs (e.g., from a race), MongoDB rejects it with error code `11000`, and the server rolls back the capacity decrement.

**Frontend double-click prevention:**
The "Book" button sets `isBooking = true` immediately on click, disabling itself before the API call completes. A rapid second click is ignored because the button is already disabled.

---

## 2. One trade-off you made and why

**Trade-off: Non-transactional two-step booking (atomic decrement + separate booking insert) instead of a full MongoDB transaction.**

I chose to split the booking into two steps:
1. Atomically decrement `remainingCapacity` via `findOneAndUpdate`
2. Create a `Booking` document (with rollback on failure)

A full multi-document transaction (`startSession → startTransaction → commit`) would guarantee both steps succeed or fail together. However:
- Transactions require a **replica set** (not available with a basic local `mongod` setup), making local development harder.
- The `findOneAndUpdate` approach is **simpler and faster** — it's a single network round-trip for the critical operation.
- The rollback logic (`$inc: +1` if booking creation fails) handles the edge case of booking insert failure.

This trade-off prioritizes **ease of setup and reliability in the common case** over theoretical atomicity for a rare edge case (booking insert failing after capacity decrement).

---

## 3. Setup steps (clean clone)

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally on `mongodb://localhost:27017`

### Install & Run

```bash
# 1. Clone the repo
git clone <repo-url>
cd slot-booking-system

# 2. Install backend dependencies
cd Backend
npm install

# 3. Seed the database with sample slots
node seed.js

# 4. Start the backend server (runs on port 5000)
node index.js

# 5. Open a new terminal — install & start frontend
cd Frontend
npm install
npm run dev

# 6. Open http://localhost:5173 in your browser
```

### Verify race-safety

Open multiple browser tabs and try to book the same slot simultaneously, or run concurrent API requests:

```bash
# Fire 10 parallel booking requests at a slot with capacity 3
# Only 3 should return 201, the rest should return 409
for i in $(seq 1 10); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/slots/<SLOT_ID>/book \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"testuser$i\"}" &
done
wait
```

---

## Tech Stack

| Layer    | Technology           |
|----------|---------------------|
| Frontend | React 19 + Vite     |
| Backend  | Express 5 + Node.js |
| Database | MongoDB + Mongoose  |

## API Endpoints

| Method | Endpoint               | Description                     | Error Codes     |
|--------|------------------------|---------------------------------|-----------------|
| GET    | `/api/slots`           | List all slots with capacity    | 500             |
| POST   | `/api/slots/:id/book`  | Book a slot (race-safe)         | 400, 404, 409   |
| GET    | `/api/bookings?userId=`| Get user's bookings             | 400, 500        |
