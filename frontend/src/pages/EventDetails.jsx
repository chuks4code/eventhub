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
    // Track whether the current user has already booked this event
    const [alreadyBooked, setAlreadyBooked] = useState(false);

    // Store an error message if the event cannot be loaded
    const [error, setError] = useState("");

    // Load the event and check whether the user has already booked it
    useEffect(() => {

        // Get the JWT saved when the user logged in
        const token = localStorage.getItem("token");

        // Load the event details
        const loadEvent = async () => {

            try {

                // Request the specific event from our Express backend
                const eventResponse = await fetch(
                    `http://localhost:5000/api/events/${id}`
                );

                // Check whether the event request was successful
                if (!eventResponse.ok) {
                    throw new Error("Event not found");
                }

                // Convert the event response into JavaScript data
                const eventData = await eventResponse.json();

                // Store the event
                setEvent(eventData);

                // If the user is logged in, check their bookings
                if (token) {

                    // Request the current user's bookings
                    const bookingsResponse = await fetch(
                        "http://localhost:5000/api/bookings",
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );

                    // Check whether the bookings request was successful
                    if (bookingsResponse.ok) {

                        // Convert bookings into JavaScript data
                        const bookingsData = await bookingsResponse.json();

                        // Check whether this event has a confirmed booking
                        const hasBookedEvent = bookingsData.some(
                            (booking) =>
                                String(booking.event_id) === String(id) &&
                                booking.status === "confirmed"
                        );

                        // Store the result
                        setAlreadyBooked(hasBookedEvent);
                    }
                }

                // Stop showing the loading message
                setLoading(false);

            } catch (error) {

                // Display the technical error in the browser console
                console.error(error);

                // Display a user-friendly error message
                setError("Unable to load event.");

                // Stop showing the loading message
                setLoading(false);
            }
        };

        // Run the function
        loadEvent();

    }, [id]);

            // Handle event payment and booking
    const handleBooking = async () => {

        // Get the JWT saved when the user logged in
        const token = localStorage.getItem("token");

        // Make sure the user is logged in
        if (!token) {
            setBookingMessage("Please login before booking an event.");
            return;
        }

        // Make sure the ticket quantity is valid
        if (quantity < 1) {
            setBookingMessage("Please select at least 1 ticket.");
            return;
        }

        // Clear any previous message
        setBookingMessage("");

        // Show the loading state
        setBookingLoading(true);

        try {

            // Ask our backend to create a Stripe Checkout session
            const response = await fetch(
                "http://localhost:5000/api/payments/create-checkout-session",
                {
                    method: "POST",

                    // Send the JWT so the backend knows which user
                    // is creating the booking
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },

                    // Send the event and ticket quantity
                    body: JSON.stringify({
                        eventId: id,
                        quantity: quantity
                    })
                }
            );

            // Convert the backend response into JavaScript data
            const data = await response.json();

            // Check whether the Checkout session was created
            if (!response.ok) {
                setBookingMessage(
                    data.message || "Unable to start payment."
                );
                return;
            }

            // Make sure Stripe returned a Checkout URL
            if (!data.url) {
                setBookingMessage(
                    "Stripe Checkout URL was not returned."
                );
                return;
            }

            // Send the user to Stripe Checkout
            window.location.href = data.url;

        } catch (error) {

            // Display the technical error in the browser console
            console.error(error);

            // Show a user-friendly message
            setBookingMessage(
                "Unable to connect to the payment server."
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

                    {/* Show booking controls only if the user has not already booked */}
                        {!alreadyBooked && (
                            <div className="booking-section">

                                {/* Ticket quantity selector */}
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
                                        ? "Preparing Payment..."
                                        : "Pay & Book"}
                                </button>

                                {/* Display payment or booking result */}
                                {bookingMessage && (
                                    <p className="booking-message">
                                        {bookingMessage}
                                    </p>
                                )}

                            </div>
                        )}

                        {/* Tell the user when they have already booked this event */}
                        {alreadyBooked && (
                            <p className="booking-message">
                                ✓ You have already booked this event.
                            </p>
                        )}
                    

                </div>

            </div>

        </section>
    );
}

// Export the component so App.jsx can use it
export default EventDetails;