// Import React hooks
import { useEffect, useState } from "react";

// Import navigation tools
import { Link, useNavigate, useParams } from "react-router-dom";

function EditEvent() {

    // Get the event ID from the URL
    const { id } = useParams();

    // Used to navigate after saving
    const navigate = useNavigate();

    // Store the event information
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        location: "",
        event_date: "",
        price: "",
        capacity: "",
        image_url: ""
    });

    // Store loading, success and error states
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Load the event when the page opens
    useEffect(() => {

        const token = localStorage.getItem("token");

        const fetchEvent = async () => {
            try {

                // Get the event from the backend
                const response = await fetch(
                    `http://localhost:5000/api/events/${id}`
                );

                const data = await response.json();

                // Check whether the event was found
                if (!response.ok) {
                    setError(
                        data.message ||
                        "Failed to load event."
                    );
                    return;
                }

                // Convert the database date into
                // the format required by datetime-local
                const formattedDate = new Date(
                    data.event_date
                );

                const localDate = new Date(
                    formattedDate.getTime() -
                    formattedDate.getTimezoneOffset() * 60000
                )
                    .toISOString()
                    .slice(0, 16);

                // Put the event information into the form
                setFormData({
                    title: data.title || "",
                    description: data.description || "",
                    location: data.location || "",
                    event_date: localDate,
                    price: data.price || "",
                    capacity: data.capacity || "",
                    image_url: data.image_url || ""
                });

            } catch (error) {

                console.error(error);

                setError(
                    "Unable to connect to the server."
                );

            } finally {

                setLoading(false);

            }
        };

        fetchEvent();

    }, [id]);

    // Update the form when the organizer types
    const handleChange = (event) => {

        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Submit the updated event
    const handleSubmit = async (event) => {

        event.preventDefault();

        setMessage("");
        setError("");

        const token = localStorage.getItem("token");

        // Make sure the organizer is logged in
        if (!token) {
            setError(
                "Please login to edit this event."
            );
            return;
        }

        try {

            // Send the updated event to the backend
            const response = await fetch(
                `http://localhost:5000/api/events/${id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",

                        // Send the organizer's JWT
                        Authorization: `Bearer ${token}`
                    },

                    // Send the updated event information
                    body: JSON.stringify({
                        ...formData,
                        price: Number(formData.price),
                        capacity: Number(formData.capacity)
                    })
                }
            );

            const data = await response.json();

            // Check whether the update worked
            if (!response.ok) {
                setError(
                    data.message ||
                    "Failed to update event."
                );
                return;
            }

            // Show success message
            setMessage(
                "Event updated successfully!"
            );

            // Give the user a moment to see
            // the success message before returning
            setTimeout(() => {
                navigate("/organizer");
            }, 800);

        } catch (error) {

            console.error(error);

            setError(
                "Unable to connect to the server."
            );
        }
    };

    // Show loading while the event is being retrieved
    if (loading) {
        return (
            <section className="create-event-section">
                <div className="create-event-card">
                    <p>Loading event...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="create-event-section">

            <div className="create-event-card">

                <h1>Edit Event</h1>

                <p>
                    Update your event information.
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
                        />
                    </label>

                    {/* Save changes */}
                    <button
                        type="submit"
                        className="create-event-btn"
                    >
                        Save Changes
                    </button>

                </form>

                {/* Return to organizer dashboard */}
                <Link
                    to="/organizer"
                    className="back-btn"
                >
                    Back to Dashboard
                </Link>

            </div>

        </section>
    );
}

export default EditEvent;