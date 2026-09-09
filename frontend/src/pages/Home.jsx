import { useEffect, useState } from "react"; // Import React hooks for state and running code
import { Link } from "react-router-dom";

function Home() {
    const [events, setEvents] = useState([]); // Store the events received from the server
    const [loading, setLoading] = useState(true); // Keep track of whether events are still loading
    const [error, setError] = useState(""); // Store an error message if loading events fails

    useEffect(() => { // Run this code when the Home page loads
        fetch("http://localhost:5000/api/events") // Request events from the backend
            .then((response) => {
                if (!response.ok) { // If the server request failed, show an error
                    throw new Error("Failed to fetch events");
                }

                return response.json(); // Convert the server response into JavaScript data
            })
            .then((data) => {
                setEvents(data); // Save the events received from the backend
                setLoading(false); // Events finished loading
            })
            .catch((error) => {
                console.error(error); // Show the error in the browser console
                setError("Unable to load events."); // Show an error message to the user
                setLoading(false); // Stop showing the loading message
            });
    }, []); // Run only once when the Home page first loads

    return (
        <>
            <section className="hero">
                <div className="hero-content">
                    <h1>Discover Amazing Events</h1>

                    <p>
                        Find workshops, conferences, meetups and experiences
                        happening near you.
                    </p>

                    <button className="hero-btn">
                        Explore Events
                    </button>
                </div>
            </section>

            <section className="events-section" id="events">

                <div className="section-heading">
                    <h2>Upcoming Events</h2>
                    <p>Find your next experience.</p>
                </div>

                {loading && ( // If events are still loading, show the loading message
                    <p className="status-message">
                        Loading events...
                    </p>
                )}

                {error && ( // If there is an error, show the error message
                    <p className="status-message error">
                        {error}
                    </p>
                )}

                {!loading && !error && ( // If we are NOT loading AND there is NO error, show the events
                    <div className="events-grid">

                        {events.map((event) => ( // Go through each event and create an event card

                            <div
                                className="event-card"
                                key={event.id} // Give each event card a unique key
                            >

                                <div className="event-image">
                                    <span>Event</span>
                                </div>

                                <div className="event-content">

                                    <h3>{event.title}</h3> {/* Show the event title */}

                                    <p className="description">
                                        {event.description} {/* Show the event description */}
                                    </p>

                                    <div className="event-info">

                                        <p>
                                            📍 {event.location} {/* Show the event location */}
                                        </p>

                                        <p>
                                            📅{" "}
                                            {new Date(
                                                event.event_date
                                            ).toLocaleDateString()} {/* Convert the date and display it in a readable format */}
                                        </p>

                                    </div>

                                    <div className="event-footer">

                                        <strong>
                                            ${Number(event.price).toFixed(2)} {/* Convert price to a number and show 2 decimal places */}
                                        </strong>

                                        <Link
                                            to={`/events/${event.id}`}
                                            className="view-event-btn"
                                        >
                                            View Event
                                        </Link>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>
                )}

            </section>
        </>
    );
}

export default Home; // Make the Home component available to other files