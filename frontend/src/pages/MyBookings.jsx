// Import React hooks for loading and storing bookings
import { useEffect, useState } from "react";

// Import Link for navigation
import { Link } from "react-router-dom";

function MyBookings() {
    // Store the user's bookings
    const [bookings, setBookings] = useState([]);

    // Track whether bookings are loading
    const [loading, setLoading] = useState(true);

    // Store an error message
    const [error, setError] = useState("");

    // Load the user's bookings when the page opens
    useEffect(() => {
        const fetchBookings = async () => {
            // Get the JWT token saved during login
            const token = localStorage.getItem("token");

            // Make sure the user is logged in
            if (!token) {
                setError("Please login to view your bookings.");
                setLoading(false);
                return;
            }

            try {
                // Request the logged-in user's bookings
                const response = await fetch(
                    "http://localhost:5000/api/bookings",
                    {
                        headers: {
                            // Send the JWT to the protected API
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                // Convert the response to JavaScript data
                const data = await response.json();

                // Check whether the request was successful
                if (!response.ok) {
                    setError(
                        data.message || "Failed to load bookings."
                    );
                    return;
                }

                // Store the bookings returned by the backend
                setBookings(data);

            } catch (error) {
                // Display the error in the browser console
                console.error(error);

                // Show a user-friendly error
                setError("Unable to connect to the server.");

            } finally {
                // Stop the loading state
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    // Show loading message
    if (loading) {
        return (
            <section className="bookings-section">
                <p className="status-message">
                    Loading your bookings...
                </p>
            </section>
        );
    }

    // Show error message
    if (error) {
        return (
            <section className="bookings-section">
                <p className="status-message error">
                    {error}
                </p>

                <Link to="/login" className="back-btn">
                    Go to Login
                </Link>
            </section>
        );
    }

    return (
        <section className="bookings-section">

            {/* Page heading */}
            <h1>My Bookings</h1>

            <p className="bookings-subtitle">
                View your upcoming event bookings.
            </p>

            {/* Show message when the user has no bookings */}
            {bookings.length === 0 ? (
                <div className="no-bookings">
                    <h2>No bookings yet</h2>

                    <p>
                        You haven't registered for any events.
                    </p>

                    <Link to="/" className="view-events-btn">
                        Browse Events
                    </Link>
                </div>
            ) : (

                // Display each booking
                <div className="bookings-grid">

                    {bookings.map((booking) => (
                        <div
                            className="booking-card"
                            key={booking.id}
                        >

                            {/* Event information */}
                            <div className="booking-content">

                                <h2>
                                    {booking.title}
                                </h2>

                                <p>
                                    {booking.description}
                                </p>

                                <div className="booking-info">

                                    <p>
                                        📍 <strong>Location:</strong>{" "}
                                        {booking.location}
                                    </p>

                                    <p>
                                        📅 <strong>Date:</strong>{" "}
                                        {new Date(
                                            booking.event_date
                                        ).toLocaleDateString()}
                                    </p>

                                    <p>
                                        🎟️ <strong>Tickets:</strong>{" "}
                                        {booking.quantity}
                                    </p>

                                    <p>
                                        💰 <strong>Total:</strong>{" "}
                                        $
                                        {Number(
                                            booking.total_amount
                                        ).toFixed(2)}
                                    </p>

                                    <p>
                                        📌 <strong>Status:</strong>{" "}
                                        <span className="booking-status">
                                            {booking.status}
                                        </span>
                                    </p>

                                </div>

                                {/* Link back to the event */}
                                <Link
                                    to={`/events/${booking.event_id}`}
                                    className="view-event-btn"
                                >
                                    View Event
                                </Link>

                            </div>

                        </div>
                    ))}

                </div>
            )}

        </section>
    );
}

// Export the MyBookings page
export default MyBookings;