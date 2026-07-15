import { useState, useEffect, useCallback } from "react";
import SlotCard from "./components/SlotCard";
import api from "./config/api";
import "./App.css";

function App() {
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [userId, setUserId] = useState("user1");
  const [activeTab, setActiveTab] = useState("slots"); // "slots" | "bookings"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Show toast notification
  const showToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Fetch slots
  const fetchSlots = useCallback(async () => {
    try {
      const res = await api.get("/slots");
      setSlots(res.data);
    } catch (err) {
      console.error("Fetch slots error:", err);
      throw err;
    }
  }, []);

  // Fetch bookings for current user
  const fetchBookings = useCallback(async () => {
    if (!userId.trim()) {
      setBookings([]);
      return;
    }
    try {
      const res = await api.get(`/bookings?userId=${encodeURIComponent(userId.trim())}`);
      setBookings(res.data);
    } catch (err) {
      console.error("Fetch bookings error:", err);
      throw err;
    }
  }, [userId]);

  // Initial load
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchSlots(), fetchBookings()]);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetchSlots, fetchBookings]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh slots every 10 seconds for live availability
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSlots().catch(() => {}); // silently refresh
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchSlots]);

  // After a booking, refresh both slots and bookings
  const handleBookingComplete = useCallback(async () => {
    try {
      await Promise.all([fetchSlots(), fetchBookings()]);
      showToast("success", "Slot booked successfully!");
    } catch {
      // slots/bookings will still show stale data but that's ok
    }
  }, [fetchSlots, fetchBookings, showToast]);

  // Check if user already booked a slot
  const isSlotBooked = (slotId) => {
    return bookings.some((b) => (b.slot?._id || b.slot) === slotId);
  };

  // Render
  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading slots...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error-container">
          <span className="error-icon">⚠️</span>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={loadData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === "success" ? "✅" : "⚠️"} {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="app-header">
        <h1>⚡ Slot Booking</h1>
        <p>Book your seat — live availability, race-safe bookings</p>
      </header>

      {/* User ID Input */}
      <div className="user-section">
        <label htmlFor="user-id-input">Your User ID</label>
        <input
          id="user-id-input"
          className="user-input"
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter your user ID..."
        />
      </div>

      {/* Tab Navigation */}
      <nav className="tab-nav">
        <button
          id="tab-slots"
          className={`tab-btn ${activeTab === "slots" ? "active" : ""}`}
          onClick={() => setActiveTab("slots")}
        >
          Available Slots ({slots.length})
        </button>
        <button
          id="tab-bookings"
          className={`tab-btn ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          My Bookings ({bookings.length})
        </button>
      </nav>

      {/* Slots Tab */}
      {activeTab === "slots" && (
        <div className="slots-grid">
          {slots.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No slots available</h3>
              <p>Check back later for new slots.</p>
            </div>
          ) : (
            slots.map((slot) => (
              <SlotCard
                key={slot._id}
                slot={slot}
                userId={userId}
                isBooked={isSlotBooked(slot._id)}
                onBook={handleBookingComplete}
              />
            ))
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <div className="bookings-list">
          {!userId.trim() ? (
            <div className="empty-state">
              <div className="empty-icon">🔑</div>
              <h3>Enter a User ID</h3>
              <p>Type your user ID above to see your bookings.</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No bookings yet</h3>
              <p>Book a slot to see it here.</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking._id} className="booking-card">
                <div className="booking-info">
                  <h3>{booking.slot?.title || "Unknown Slot"}</h3>
                  <p>
                    {booking.slot
                      ? `${new Date(booking.slot.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })} • ${booking.slot.startTime} – ${booking.slot.endTime}`
                      : "Details unavailable"}
                  </p>
                </div>
                <span className="booking-badge">✓ Confirmed</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;
