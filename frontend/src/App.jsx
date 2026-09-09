// Import React Router components
import { Link, Route, Routes } from "react-router-dom";

// Import page components
import Home from "./pages/Home";
import EventDetails from "./pages/EventDetails";
import Login from "./pages/Login";
// Import the registration page
import Register from "./pages/Register";
// Import the user's bookings page
import MyBookings from "./pages/MyBookings";

// Import application styles
import "./App.css";

function App() {

    return (
        <div className="app">

            {/* Navigation bar */}
            <nav className="navbar">

                {/* EventHub logo */}
                <div className="logo">
                    EventHub
                </div>

                {/* Navigation links */}
                <div className="nav-links">

                    {/* Go to the Home page */}
                    <Link to="/">
                        Events
                    </Link>

                    {/* Go to the user's bookings */}
                    <Link to="/bookings">
                        My Bookings
                    </Link>

                    {/* Go to the Login page */}
                    <Link to="/login">
                        Login
                    </Link>

                    {/* Go to the Register page */}
                    <Link to="/register">
                        Register
                    </Link>

                </div>
            </nav>

            {/* Define the pages in our application */}
            <Routes>

                {/* Home page */}
                <Route
                    path="/"
                    element={<Home />}
                />

                {/* Individual event details page */}
                <Route
                    path="/events/:id"
                    element={<EventDetails />}
                />

                {/* Login page */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                 {/* User's bookings page */}
                <Route
                    path="/bookings"
                    element={<MyBookings />}
                />

                {/* Registration page */}
                <Route
                    path="/register"
                    element={<Register />}
                />

            </Routes>

            {/* Footer */}
            <footer>
                <p>
                    © 2026 EventHub. All rights reserved.
                </p>
            </footer>

        </div>
    );
}

// Make the App component available to other files
export default App;