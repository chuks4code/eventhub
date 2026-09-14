import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function OrganizerDashboard() {
    // Store the organizer's events
    const [events, setEvents] = useState([]);

    // Store loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        // Get the organizer's JWT
        const token = localStorage.getItem("token");

        // Get the organizer's events from the backend
        const fetchEvents = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/organizer/events",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                // Check whether the request was successful
                if (!response.ok) {
                    setError(
                        data.message ||
                        "Failed to load your events."
                    );
                    return;
                }

                // Save the organizer's events
                setEvents(data);

            } catch (error) {
                console.error(error);

                setError(
                    "Unable to connect to the server."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);


        // Delete an event created by the organizer
    const handleDelete = async (eventId) => {

        // Ask for confirmation before deleting
        const confirmed = window.confirm(
            "Are you sure you want to delete this event?"
        );

        // Stop if the organizer cancels
        if (!confirmed) {
            return;
        }

        // Get the organizer's JWT
        const token = localStorage.getItem("token");

        try {

            // Send the delete request to the backend
            const response = await fetch(
                `http://localhost:5000/api/events/${eventId}`,
                {
                    method: "DELETE",

                    headers: {
                        // Send the JWT to the protected endpoint
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            // Check whether the delete was successful
            if (!response.ok) {
                alert(
                    data.message ||
                    "Failed to delete event."
                );
                return;
            }

            // Remove the deleted event from the dashboard
            setEvents((currentEvents) =>
                currentEvents.filter(
                    (event) => event.id !== eventId
                )
            );

            // Show confirmation
            alert("Event deleted successfully.");

        } catch (error) {

            console.error(error);

            alert(
                "Unable to connect to the server."
            );
        }
    };

    return (
        <section className="organizer-dashboard">

            <div className="organizer-dashboard-header">
                <h1>Organizer Dashboard</h1>

                <p>
                    Manage your events on EventHub.
                </p>

                <Link
                    to="/create-event"
                    className="create-event-btn"
                >
                    + Create Event
                </Link>
            </div>

            <h2>My Events</h2>

            {/* Show loading message */}
            {loading && (
                <p>Loading your events...</p>
            )}

            {/* Show error message */}
            {error && (
                <p className="status-message error">
                    {error}
                </p>
            )}

            {/* Show message when organizer has no events */}
            {!loading &&
                !error &&
                events.length === 0 && (
                    <p>
                        You haven't created any events yet.
                    </p>
                )}

            {/* Display organizer's events */}
            <div className="organizer-events">

                {events.map((event) => (
                    <div
                        className="organizer-event-card"
                        key={event.id}
                    >
                        <h3>{event.title}</h3>

                        <p>
                            {event.description}
                        </p>

                        <p>
                            📍 <strong>Location:</strong>{" "}
                            {event.location}
                        </p>

                        <p>
                            📅 <strong>Date:</strong>{" "}
                            {new Date(
                                event.event_date
                            ).toLocaleString()}
                        </p>

                        <p>
                            🎟️ <strong>Capacity:</strong>{" "}
                            {event.capacity}
                        </p>

                        <p>
                            💰 <strong>Price:</strong>{" "}
                            ${Number(event.price).toFixed(2)}
                        </p>

                        <div className="organizer-event-actions">

                            {/* View the public event page */}
                            <Link
                                to={`/events/${event.id}`}
                                className="view-event-btn"
                            >
                                View Event
                            </Link>

                            {/* Edit this organizer's event */}
                            <Link
                                to={`/organizer/edit/${event.id}`}
                                className="edit-event-btn"
                            >
                                Edit
                            </Link>

                            {/* Delete this organizer's event */}
                            <button
                                type="button"
                                className="delete-event-btn"
                                onClick={() => handleDelete(event.id)}
                            >
                                Delete
                            </button>

                        </div>
                    </div>
                ))}

            </div>

        </section>
    );
}

export default OrganizerDashboard;