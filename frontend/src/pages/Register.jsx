// Import React hooks for managing registration and Google Sign-In
import { useEffect, useState } from "react";

// Import Link and useNavigate for navigation
import { Link, useNavigate } from "react-router-dom";

function Register() {
    // Store the name entered by the user
    const [name, setName] = useState("");

    // Store the email entered by the user
    const [email, setEmail] = useState("");

    // Store the password entered by the user
    const [password, setPassword] = useState("");

    // Store the password confirmation
    const [confirmPassword, setConfirmPassword] = useState("");

    // Store registration error or success messages
    const [message, setMessage] = useState("");

    // Track whether registration is being processed
    const [loading, setLoading] = useState(false);

    // Allows us to redirect the user after successful registration
    const navigate = useNavigate();

    // Handle the Google credential returned by Google Sign-In
                const handleGoogleRegister = async (response) => {
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

                        // Check whether Google authentication was successful
                        if (!result.ok) {
                            setMessage(data.message || "Google registration failed");
                            return;
                        }

                        // Store the JWT token in the browser
                        localStorage.setItem("token", data.token);

                        // Store the user's information
                        localStorage.setItem(
                            "user",
                            JSON.stringify(data.user)
                        );

                        // Redirect the user to the homepage
                        navigate("/");
                    } catch (error) {
                        // Display the error in the browser console
                        console.error(error);

                        // Show a user-friendly error message
                        setMessage("Google registration failed.");
                    }
                };


            // Load and initialize Google Sign-In when the register page opens
        useEffect(() => {
            // Make sure the Google library has loaded
            if (!window.google) {
                console.error("Google Identity Services failed to load.");
                return;
            }

            // Initialize Google Sign-In
            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

                // This function runs after Google successfully signs in
                callback: handleGoogleRegister
            });

            // Display the Google Sign-In button
            window.google.accounts.id.renderButton(
                document.getElementById("google-register-button"),
                {
                    theme: "outline",
                    size: "large",
                    width: 380
                }
            );
        }, []);            


    // Handle registration form submission
    const handleRegister = async (e) => {
        // Prevent the browser from refreshing the page
        e.preventDefault();

        // Clear any previous message
        setMessage("");

        // Make sure both passwords match before contacting the backend
        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        // Show the loading state
        setLoading(true);

        try {
            // Send the registration information to our Express backend
            const response = await fetch(
                "http://localhost:5000/api/auth/register",
                {
                    method: "POST",

                    // Tell the backend that we are sending JSON
                    headers: {
                        "Content-Type": "application/json"
                    },

                    // Convert the registration information to JSON
                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );

            // Convert the backend response to JavaScript data
            const data = await response.json();

            // Check whether registration was successful
            if (!response.ok) {
                setMessage(data.message || "Registration failed.");
                return;
            }

            // Store the JWT token returned by the backend
            localStorage.setItem("token", data.token);

            // Store the newly registered user's information
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            // Redirect the user to the homepage
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

                {/* Registration page heading */}
                <h1>Create Account</h1>

                <p>
                    Create your EventHub account.
                </p>

                {/* Display registration error messages */}
                {message && (
                    <p className="login-message">
                        {message}
                    </p>
                )}

                {/* Registration form */}
                <form onSubmit={handleRegister}>

                    {/* Name field */}
                    <label htmlFor="name">
                        Name
                    </label>

                    <input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    {/* Email field */}
                    <label htmlFor="register-email">
                        Email
                    </label>

                    <input
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    {/* Password field */}
                    <label htmlFor="register-password">
                        Password
                    </label>

                    <input
                        id="register-password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {/* Confirm password field */}
                    <label htmlFor="confirm-password">
                        Confirm Password
                    </label>

                    <input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) =>
                            setConfirmPassword(e.target.value)
                        }
                        required
                    />

                    {/* Submit registration form */}
                    <button
                        type="submit"
                        className="login-submit-btn"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating Account..."
                            : "Create Account"}
                    </button>

                    {/* Divider between normal registration and Google */}
                    <div className="login-divider">
                        <span>OR</span>
                    </div>

                    {/* Google Sign-In button */}
                    <div
                        id="google-register-button"
                        className="google-login-btn"
                    ></div>
                </form>

                {/* Link back to login */}
                <p className="register-link">
                    Already have an account?{" "}

                    <Link to="/login">
                        Login
                    </Link>
                </p>
            </div>
        </section>
    );
}

// Export the Register component
export default Register;