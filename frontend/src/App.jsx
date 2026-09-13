// Import React hook for managing login state
import { useState } from "react";
// Import the cart hook
import { useCart } from "./CartContext.jsx";

// Import React Router components
import { Link, Navigate, Route, Routes } from "react-router-dom";

// Import page components
import Home from "./pages/Home";
import EventDetails from "./pages/EventDetails";
import Login from "./pages/Login";
// Import the registration page
import Register from "./pages/Register";
// Import the user's bookings page
import MyBookings from "./pages/MyBookings";
import PaymentSuccess from "./pages/PaymentSuccess";
// Import the shopping cart page
import Cart from "./pages/Cart";

// Import application styles
import "./App.css";

function App() {

        // Track whether the user is logged in
        const [isLoggedIn, setIsLoggedIn] = useState(
            !!localStorage.getItem("token")
        );

        // Get the number of tickets currently in the cart
        const { cartItemCount } = useCart();

    // Log the user out
      const handleLogout = () => {

    // Remove the JWT token
    localStorage.removeItem("token");

    // Remove the saved user information
    localStorage.removeItem("user");

    // Tell CartContext that the user has changed
    window.dispatchEvent(
        new Event("eventhub-auth-changed")
    );

    // Update the React login state
    setIsLoggedIn(false);

    // Send the user back to the Login page
    window.location.href = "/login";
    };

    return (
                <div className="app">

                    <div className="nav-links">

                        {/* Always show the Events link */}
                        <Link to="/">
                            Events
                        </Link>

                        {/* Only show My Bookings when the user is logged in */}
                        {isLoggedIn && (
                            <Link to="/bookings">
                                My Bookings
                            </Link>
                        )}

                        {/* Show the shopping cart when the user is logged in */}
                        {isLoggedIn && (
                            <Link to="/cart">
                                🛒 Cart ({cartItemCount})
                            </Link>
                        )}

                        {/* Only show Login and Register when the user is logged out */}
                        {!isLoggedIn && (
                            <>
                                <Link to="/login">
                                    Login
                                </Link>

                                <Link to="/register">
                                    Register
                                </Link>
                            </>
                        )}

                        {/* Show Logout when the user is logged in */}
                        {isLoggedIn && (
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="logout-btn"
                            >
                                Logout
                            </button>
                        )}

                 </div>

            {/* Define the pages in our application */}
            <Routes>

                {/* Home page */}
                {/* Send users to Login if they are not logged in */}
                <Route
                    path="/"
                   element={
                        isLoggedIn ? (
                            <Home />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* Individual event details page */}
                <Route
                    path="/events/:id"
                    element={<EventDetails />}
                />

                {/* Login page */}
                <Route
                    path="/login"
                    element={
                        <Login
                            onLogin={() => setIsLoggedIn(true)}
                        />
                    }
                />

                 {/* User's bookings page */}
                <Route
                        path="/bookings"
                        element={
                            isLoggedIn ? (
                                <MyBookings />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                />

                {/* Shopping cart */}
                <Route
                    path="/cart"
                    element={
                        isLoggedIn ? (
                            <Cart />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />



                {/* Registration page */}
                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* Strip Payment Success */}
                <Route path="/payment-success" element={<PaymentSuccess />} />

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