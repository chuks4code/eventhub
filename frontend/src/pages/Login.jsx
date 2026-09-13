// Import React hooks for managing state and loading Google Sign-In
import { useEffect, useState } from "react";

// Import Link for navigation between pages
import { Link, useNavigate } from "react-router-dom";

function Login({ onLogin }) {

    // Store the email entered by the user
    const [email, setEmail] = useState("");

    // Store the password entered by the user
    const [password, setPassword] = useState("");

    // Store an error or success message
    const [message, setMessage] = useState("");

    // Track whether the login request is being processed
    const [loading, setLoading] = useState(false);

    // Allows us to redirect the user after successful login
    const navigate = useNavigate();


    // Handle the Google credential returned by Google Sign-In
        const handleGoogleLogin = async (response) => {
            try {
                // Send the Google credential to our Express backend
                const result = await fetch(
                    "http://localhost:5000/api/auth/google",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            credential: response.credential
                        })
                    }
                );

                // Convert the backend response to JavaScript data
                const data = await result.json();

                // Check whether Google login was successful
                if (!result.ok) {
                    setMessage(data.message || "Google login failed");
                    return;
                }

                // Store the JWT token in the browser
                localStorage.setItem("token", data.token);

                // Store the logged-in user's information
                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                // Tell CartContext that a new user has logged in
                window.dispatchEvent(
                    new Event("eventhub-auth-changed")
                );

                // Tell App.jsx that the user is now logged in
                onLogin();

                // Redirect the user to the homepage
                navigate("/");
            } catch (error) {
                // Display the error in the browser console
                console.error(error);

                // Show a user-friendly error message
                setMessage("Google login failed.");
            }
        };


    // Load and initialize Google Sign-In when the login page opens
        useEffect(() => {
            // Make sure the Google library has loaded
            if (!window.google) {
                console.error("Google Identity Services failed to load.");
                return;
            }

            // Initialize Google Sign-In
            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

                // This function runs after Google successfully signs the user in
                callback: handleGoogleLogin
            });

            // Display the Google Sign-In button
            window.google.accounts.id.renderButton(
                document.getElementById("google-login-button"),
                {
                    theme: "outline",
                    size: "large",
                    width: 380
                }
            );
        }, []);


    // Handle the login form submission
    const handleLogin = async (e) => {

        // Prevent the browser from refreshing the page
        e.preventDefault();

        // Clear any previous message
        setMessage("");

        // Show the loading state
        setLoading(true);

        try {

            // Send the login information to our Express backend
            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",

                    // Tell the backend that we are sending JSON
                    headers: {
                        "Content-Type": "application/json"
                    },

                    // Convert the login information to JSON
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            // Convert the backend response to JavaScript data
            const data = await response.json();


            // Check whether the login was successful
            if (!response.ok) {

                // Display the error returned by the backend
                setMessage(data.message || "Login failed");

                return;
            }


           // Store the JWT token in the browser
                localStorage.setItem("token", data.token);

                // Store the logged-in user's information
                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                // Tell CartContext that a new user has logged in
                window.dispatchEvent(
                    new Event("eventhub-auth-changed")
                );

                // Tell App.jsx that the user is now logged in
                onLogin();

                // Redirect the user back to the home page
                navigate("/");

        } catch (error) {

            // Display the error in the browser console
            console.error(error);

            // Show a user-friendly error message
            setMessage("Unable to connect to the server.");

        } finally {

            // Stop the loading state
            setLoading(false);
        }
    };


    return (
        <section className="login-section">

            <div className="login-card">

                {/* Login page heading */}
                <h1>Welcome Back</h1>

                <p>
                    Login to your EventHub account.
                </p>


                {/* Display login error messages */}
                {message && (
                    <p className="login-message">
                        {message}
                    </p>
                )}


                {/* Login form */}
                <form onSubmit={handleLogin}>

                    {/* Email field */}
                    <label htmlFor="email">
                        Email
                    </label>

                    <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />


                    {/* Password field */}
                    <label htmlFor="password">
                        Password
                    </label>

                    <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />


                    {/* Submit login form */}
                    <button
                        type="submit"
                        className="login-submit-btn"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </form>


                {/* Divider */}
                <div className="login-divider">
                    <span>OR</span>
                </div>


                
                    {/* Google Sign-In button will be rendered here */}
                    <div
                        id="google-login-button"
                        className="google-login-btn"
                    ></div>


                {/* Link to registration page */}
                <p className="register-link">
                    Don't have an account?{" "}

                    <Link to="/register">
                        Register
                    </Link>
                </p>

            </div>

        </section>
    );
}


// Export the Login component
export default Login;