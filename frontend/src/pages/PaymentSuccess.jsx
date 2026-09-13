// Import React hook
import { useEffect } from "react";

// Import Link for navigation
import { Link } from "react-router-dom";

// Import the cart functions
import { useCart } from "../CartContext.jsx";

function PaymentSuccess() {

    // Get the function that empties the current user's cart
    const { clearCart } = useCart();

    // Clear the cart when the payment-success page loads
    useEffect(() => {

        // Remove all items from the current user's cart
        clearCart();

    }, [clearCart]);

    return (

        <section className="payment-success-section">

            <div className="payment-success-card">

                {/* Confirmation message shown after Stripe redirects back */}
                <div className="success-icon">✓</div>

                <h1>Payment Successful!</h1>

                <p>
                    Your payment was completed successfully.
                    Your event booking is being confirmed.
                </p>

                {/* Take the user back to their bookings */}
                <Link
                    to="/bookings"
                    className="success-btn"
                >
                    View My Bookings
                </Link>

                {/* Allow the user to continue browsing events */}
                <Link
                    to="/"
                    className="success-secondary-btn"
                >
                    Browse More Events
                </Link>

            </div>

        </section>
    );
}

export default PaymentSuccess;