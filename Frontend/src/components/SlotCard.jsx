import { useState } from "react";
import api from "../config/api";

function SlotCard({ slot, userId, isBooked, onBook }) {
  const [isBooking, setIsBooking] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

  const isFull = slot.remainingCapacity === 0;
  const bookedPercent = ((slot.totalCapacity - slot.remainingCapacity) / slot.totalCapacity) * 100;

  // Determine capacity status for styling
  const getCapacityStatus = () => {
    if (slot.remainingCapacity === 0) return "empty";
    if (slot.remainingCapacity <= Math.ceil(slot.totalCapacity * 0.25)) return "low";
    return "normal";
  };

  const capacityStatus = getCapacityStatus();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };


  const handleBook = async () => {
    if (isBooking || isFull || isBooked || !userId.trim()) return;

    setIsBooking(true);
    setFeedback(null);

    try {
      await api.post(`/slots/${slot._id}/book`, { userId: userId.trim() });
      setFeedback({ type: "success", message: "Booked successfully!" });
      onBook(); // refresh slots & bookings
    } catch (err) {
      const message = err.response?.data?.error || "Network error — please try again";
      setFeedback({ type: "error", message });
    } finally {
      setIsBooking(false);
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Determine button state
  const getButtonProps = () => {
    if (isBooking) {
      return {
        className: "book-btn loading",
        disabled: true,
        children: (
          <>
            <span className="btn-spinner"></span>
            Booking...
          </>
        ),
      };
    }
    if (isBooked) {
      return {
        className: "book-btn booked",
        disabled: true,
        children: (
          <>
            ✓ Booked
          </>
        ),
      };
    }
    if (isFull) {
      return {
        className: "book-btn full",
        disabled: true,
        children: "Slot Full",
      };
    }
    return {
      className: "book-btn available",
      disabled: !userId.trim(),
      children: "Book This Slot",
    };
  };

  const btnProps = getButtonProps();

  return (
    <div className={`slot-card ${isFull ? "full" : ""}`}>
      <div className="slot-card-header">
        <h3>{slot.title}</h3>
        {slot.description && <p>{slot.description}</p>}
      </div>

      <div className="slot-meta">
        <span className="slot-meta-item">
          <span className="icon">📅</span>
          {formatDate(slot.date)}
        </span>
        <span className="slot-meta-item">
          <span className="icon">🕐</span>
          {slot.startTime} – {slot.endTime}
        </span>
      </div>

      <div className="capacity-section">
        <div className="capacity-label">
          <span>Availability</span>
          <span className={`capacity-count ${capacityStatus}`}>
            {slot.remainingCapacity} / {slot.totalCapacity} seats
          </span>
        </div>
        <div className="capacity-bar">
          <div
            className={`capacity-fill ${capacityStatus}`}
            style={{ width: `${bookedPercent}%` }}
          ></div>
        </div>
      </div>

      <button
        id={`book-btn-${slot._id}`}
        className={btnProps.className}
        disabled={btnProps.disabled}
        onClick={handleBook}
      >
        {btnProps.children}
      </button>

      {feedback && (
        <div
          className={`toast ${feedback.type}`}
          style={{ marginTop: "0.75rem", position: "relative", maxWidth: "100%" }}
        >
          {feedback.type === "success" ? "✅" : "⚠️"} {feedback.message}
        </div>
      )}
    </div>
  );
}

export default SlotCard;
