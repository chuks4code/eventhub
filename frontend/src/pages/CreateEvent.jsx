// Import React hooks
import { useState } from "react";

// Import Link for navigation
import { Link } from "react-router-dom";

function CreateEvent() {

    // Store the event form information
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        location: "",
        event_date: "",
        price: "",
        capacity: "",
        image_url: ""
    });

    // Store success and error messages
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Update the form when the organizer types
    const handleChange = (event) => {

        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Submit the new event
    const handleSubmit = async (event) => {

        event.preventDefault();

        // Clear previous messages
        setMessage("");
        setError("");

        // Get the organizer's JWT
        const token = localStorage.getItem("token");

        // Make sure the organizer is logged in
        if (!token) {
            setError("Please login to create an event.");
            return;
        }

        try {

            // Send the event to the backend
            const response = await fetch(
                "http://localhost:5000/api/events",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",

                        // Send the JWT to the protected endpoint
                        Authorization: `Bearer ${token}`
                    },

                    // Send the form information
                    body: JSON.stringify({
                        ...formData,
                        price: Number(formData.price),
                        capacity: Number(formData.capacity)
                    })
                }
            );

            const data = await response.json();

            // Check whether the event was created
            if (!response.ok) {
                setError(
                    data.message || "Failed to create event."
                );
                return;
            }

            // Show success message
            setMessage("Event created successfully!");

            // Clear the form
            setFormData({
                title: "",
                description: "",
                location: "",
                event_date: "",
                price: "",
                capacity: "",
                image_url: ""
            });

            console.log("Created event:", data);

        } catch (error) {

            console.error(error);

            setError(
                "Unable to connect to the server."
            );
        }
    };

    return (

        <section className="create-event-section">

            <div className="create-event-card">

                <h1>Create Event</h1>

                <p>
                    Create and publish your event on EventHub.
                </p>

                {/* Show success message */}
                {message && (
                    <p className="success-message">
                        {message}
                    </p>
                )}

                {/* Show error message */}
                {error && (
                    <p className="status-message error">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit}>

                    {/* Event title */}
                    <label>
                        Event Title

                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter event title"
                            required
                        />
                    </label>

                    {/* Event description */}
                    <label>
                        Description

                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe your event"
                            rows="5"
                            required
                        />
                    </label>

                    {/* Event location */}
                    <label>
                        Location

                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Enter event location"
                            required
                        />
                    </label>

                    {/* Event date and time */}
                    <label>
                        Date & Time

                        <input
                            type="datetime-local"
                            name="event_date"
                            value={formData.event_date}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    {/* Ticket price */}
                    <label>
                        Ticket Price

                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                        />
                    </label>

                    {/* Event capacity */}
                    <label>
                        Ticket Capacity

                        <input
                            type="number"
                            name="capacity"
                            value={formData.capacity}
                            onChange={handleChange}
                            placeholder="Number of tickets"
                            min="1"
                            required
                        />
                    </label>

                    {/* Event image */}
                    <label>
                        Event Image URL

                        <input
                            type="text"
                            name="image_url"
                            value={formData.image_url}
                            onChange={handleChange}
                            placeholder="images/my-event.jpg"
                        />
                    </label>

                    {/* Create button */}
                    <button
                        type="submit"
                        className="create-event-btn"
                    >
                        Create Event
                    </button>

                </form>

                {/* Return to Events */}
                <Link
                    to="/"
                    className="back-btn"
                >
                    Back to Events
                </Link>

            </div>

        </section>
    );
}

export default CreateEvent;