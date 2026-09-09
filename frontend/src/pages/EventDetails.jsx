// Import React hooks for managing state and running code when the page loads
import { useEffect, useState } from "react";

// Import Link for navigation and useParams to get the event ID from the URL
import { Link, useParams } from "react-router-dom";

function EventDetails() {

    // Get the event ID from the URL
    // Example: /events/1 → id will be "1"
    const { id } = useParams();

    // Store the event information returned from the backend
    const [event, setEvent] = useState(null);

    // Track whether the event is still loading
    const [loading, setLoading] = useState(true);

    // Store the number of tickets the user wants to book
    const [quantity, setQuantity] = useState(1);

    // Store booking success or error messages
    const [bookingMessage, setBookingMessage] = useState("");

    // Track whether a booking is being created
    const [bookingLoading, setBookingLoading] = useState(false);

    // Store an error message if the event cannot be loaded
    const [error, setError] = useState("");

    // Run this code whenever the event ID changes
    useEffect(() => {

        // Request the specific event from our Express backend
        fetch(`http://localhost:5000/api/events/${id}`)

            // Check whether the backend request was successful
            .then((response) => {

                if (!response.ok) {
                    throw new Error("Event not found");
                }

                // Convert the response into JavaScript data
                return response.json();
            })

            // Store the event returned by the backend
            .then((data) => {

                setEvent(data);

                // Stop showing the loading message
                setLoading(false);
            })

            // Handle errors if the request fails
            .catch((error) => {

                // Display the actual error in the browser console
                console.error(error);

                // Display a user-friendly error message
                setError("Unable to load event.");

                // Stop showing the loading message
                setLoading(false);
            });

    }, [id]); // Run again if the event ID in the URL changes

            // Handle event booking
        const handleBooking = async () => {
            // Get the JWT saved when the user logged in
            const token = localStorage.getItem("token");

            // Make sure the user is logged in
            if (!token) {
                setBookingMessage("Please login before booking an event.");
                return;
            }

            // Clear any previous booking message
            setBookingMessage("");

            // Show the booking loading state
            setBookingLoading(true);

            try {
                // Send the booking request to our Express backend
                const response = await fetch(
                    "http://localhost:5000/api/bookings",
                    {
                        method: "POST",

                        // Send the JWT and tell the backend we are sending JSON
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },

                        // Send the event ID and number of tickets
                        body: JSON.stringify({
                            eventId: id,
                            quantity: quantity
                        })
                    }
                );

                // Convert the backend response to JavaScript data
                const data = await response.json();

                // Check whether the booking was successful
                if (!response.ok) {
                    setBookingMessage(
                        data.message || "Booking failed."
                    );
                    return;
                }

                // Show the successful booking message
                setBookingMessage(
                    "Booking created successfully!"
                );

            } catch (error) {
                // Display the error in the browser console
                console.error(error);

                // Show a user-friendly error message
                setBookingMessage(
                    "Unable to connect to the server."
                );
            } finally {
                // Stop the loading state
                setBookingLoading(false);
            }
        };


    // Show a loading message while waiting for the backend
    if (loading) {

        return (
            <section className="event-details">

                <p className="status-message">
                    Loading event...
                </p>

            </section>
        );
    }


    // Show an error message if the event could not be loaded
    if (error) {

        return (
            <section className="event-details">

                <p className="status-message error">
                    {error}
                </p>

                {/* Navigate back to the home/events page */}
                <Link to="/" className="back-btn">
                    ← Back to Events
                </Link>

            </section>
        );
    }


    // Display the event details after successfully loading the event
    return (
        <section className="event-details">

            {/* Navigate back to the events page */}
            <Link to="/" className="back-btn">
                ← Back to Events
            </Link>

            <div className="event-details-card">

                {/* Placeholder for the event image */}
                <div className="event-details-image">
                    <span>Event</span>
                </div>

                <div className="event-details-content">

                    {/* Display the event title */}
                    <h1>{event.title}</h1>

                    {/* Display the event description */}
                    <p className="details-description">
                        {event.description}
                    </p>

                    <div className="details-info">

                        {/* Display the event location */}
                        <p>
                            📍 <strong>Location:</strong>{" "}
                            {event.location}
                        </p>

                        {/* Display the event date */}
                        <p>
                            📅 <strong>Date:</strong>{" "}

                            {new Date(
                                event.event_date
                            ).toLocaleDateString()}

                        </p>

                        {/* Display the event price */}
                        <p>
                            💰 <strong>Price:</strong>{" "}
                            ${Number(event.price).toFixed(2)}
                        </p>

                        {/* Display the event capacity */}
                        <p>
                            👥 <strong>Capacity:</strong>{" "}
                            {event.capacity} people
                        </p>

                    </div>

                    {/* Ticket quantity selector */}
                    <div className="booking-section">

                        <label htmlFor="quantity">
                            Number of Tickets
                        </label>

                        <input
                            id="quantity"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) =>
                                setQuantity(Number(e.target.value))
                            }
                        />

                        {/* Calculate and display the total price */}
                        <p className="booking-total">
                            Total: $
                            {(Number(event.price) * quantity).toFixed(2)}
                        </p>

                        {/* Create the booking */}
                        <button
                            className="register-event-btn"
                            onClick={handleBooking}
                            disabled={bookingLoading}
                        >
                            {bookingLoading
                                ? "Booking..."
                                : "Register for Event"}
                        </button>

                        {/* Display booking result */}
                        {bookingMessage && (
                            <p className="booking-message">
                                {bookingMessage}
                            </p>
                        )}

                    </div>

                </div>

            </div>

        </section>
    );
}

// Export the component so App.jsx can use it
export default EventDetails;