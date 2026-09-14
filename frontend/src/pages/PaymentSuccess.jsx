// Import React hook
import { useEffect } from "react";

// Import Link for navigation
import { Link } from "react-router-dom";

// Import cart functions
import { useCart } from "../CartContext.jsx";

function PaymentSuccess() {

    // Get the function used to clear the current user's cart
    const { clearCart } = useCart();

    useEffect(() => {

        // Clear the cart after successful payment
        clearCart();

        // We only want to clear the cart once when this page loads
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (

        <section className="payment-success-section">

            <div className="payment-success-card">

                {/* Payment success icon */}
                <div className="success-icon">
                    ✓
                </div>

                {/* Success message */}
                <h1>
                    Payment Successful!
                </h1>

                <p>
                    Your payment was completed successfully.
                    Your event booking is being confirmed.
                </p>

                {/* Go to My Bookings */}
                <Link
                    to="/bookings"
                    className="success-btn"
                >
                    View My Bookings
                </Link>

                {/* Go back to the Events page */}
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