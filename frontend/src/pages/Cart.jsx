// Import React hook for managing the payment loading state
import { useState } from "react";

// Import Link for navigation between pages
import { Link } from "react-router-dom";

// Import cart functions and data
import { useCart } from "../CartContext.jsx";

function Cart() {

    // Get the cart information and functions
    const {
        cart,
        removeFromCart,
        updateQuantity,
        cartTotal
    } = useCart();

        // Track whether the payment session is being created
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    // Store any checkout error message
    const [checkoutMessage, setCheckoutMessage] = useState("");

        // Send the entire cart to the backend for one Stripe payment
    const handleCheckout = async () => {

        // Get the JWT saved when the user logged in
        const token = localStorage.getItem("token");

        // Make sure the user is logged in
        if (!token) {
            setCheckoutMessage(
                "Please login before making a payment."
            );
            return;
        }

        // Make sure the cart is not empty
        if (cart.length === 0) {
            setCheckoutMessage(
                "Your cart is empty."
            );
            return;
        }

        // Clear any previous checkout message
        setCheckoutMessage("");

        // Show the loading state
        setCheckoutLoading(true);

        try {

            // Send all cart events and quantities to our backend
            const response = await fetch(
                "http://localhost:5000/api/payments/create-cart-checkout-session",
                {
                    method: "POST",

                    // Tell the backend we are sending JSON
                    headers: {
                        "Content-Type": "application/json",

                        // Send the user's JWT
                        Authorization: `Bearer ${token}`
                    },

                    // Send only event IDs and quantities
                    // The backend will get the real prices from PostgreSQL
                    body: JSON.stringify({
                        items: cart.map((item) => ({
                            eventId: item.id,
                            quantity: item.quantity
                        }))
                    })
                }
            );

            // Convert the backend response into JavaScript data
            const data = await response.json();

            // Check whether the backend successfully created Checkout
            if (!response.ok) {
                setCheckoutMessage(
                    data.message ||
                    "Unable to start payment."
                );
                return;
            }

            // Make sure Stripe returned a Checkout URL
            if (!data.url) {
                setCheckoutMessage(
                    "Stripe Checkout URL was not returned."
                );
                return;
            }

            // Send the user to Stripe Checkout
            window.location.href = data.url;

        } catch (error) {

            // Display the technical error in the browser console
            console.error(error);

            // Show a user-friendly message
            setCheckoutMessage(
                "Unable to connect to the payment server."
            );

        } finally {

            // Stop the loading state
            setCheckoutLoading(false);
        }
    };



    // Show an empty cart message
    if (cart.length === 0) {
        return (
            <section className="cart-section">

                <div className="cart-card">

                    <h1>Your Cart</h1>

                    <p>
                        Your cart is currently empty.
                    </p>

                    {/* Return to the Events page */}
                    <Link
                        to="/"
                        className="cart-browse-btn"
                    >
                        Browse Events
                    </Link>

                </div>

            </section>
        );
    }

    return (
        <section className="cart-section">

            <div className="cart-card">

                <h1>Your Cart</h1>

                <p className="cart-subtitle">
                    Review your selected events before payment.
                </p>

                {/* Display each event in the cart */}
                <div className="cart-items">

                    {cart.map((item) => (

                        <div
                            className="cart-item"
                            key={item.id}
                        >

                            {/* Event information */}
                            <div className="cart-item-info">

                                <h2>
                                    {item.title}
                                </h2>

                                <p>
                                    {item.location}
                                </p>

                                <p>
                                    ${item.price.toFixed(2)} per ticket
                                </p>

                            </div>

                            {/* Ticket quantity controls */}
                            <div className="cart-item-actions">

                                <label
                                    htmlFor={`quantity-${item.id}`}
                                >
                                    Tickets
                                </label>

                                <input
                                    id={`quantity-${item.id}`}
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                        updateQuantity(
                                            item.id,
                                            Number(e.target.value)
                                        )
                                    }
                                />

                                {/* Remove event from cart */}
                                <button
                                    type="button"
                                    className="remove-cart-btn"
                                    onClick={() =>
                                        removeFromCart(item.id)
                                    }
                                >
                                    Remove
                                </button>

                            </div>

                            {/* Event total */}
                            <strong className="cart-item-total">
                                $
                                {(
                                    item.price *
                                    item.quantity
                                ).toFixed(2)}
                            </strong>

                        </div>

                    ))}

                </div>

                {/* Cart total and checkout actions */}
                <div className="cart-summary">

                    {/* Display the final cart total */}
                    <div className="cart-total-row">
                        <h2>Total:</h2>

                        <h2>
                            ${cartTotal.toFixed(2)}
                        </h2>
                    </div>

                    {/* Checkout buttons */}
                    <div className="cart-actions">

                        {/* Start one Stripe payment for the entire cart */}
                        <button
                            type="button"
                            className="checkout-btn"
                            onClick={handleCheckout}
                            disabled={checkoutLoading}
                        >
                            {checkoutLoading
                                ? "Preparing Payment..."
                                : "🔒 Proceed to Payment"}
                        </button>

                        {/* Continue browsing events */}
                        <Link
                            to="/"
                            className="continue-shopping-btn"
                        >
                            Continue Shopping
                        </Link>

                        {/* Display checkout errors */}
                            {checkoutMessage && (
                                <p className="checkout-message">
                                    {checkoutMessage}
                                </p>
                            )}

                    </div>

                </div>

            </div>

        </section>
    );
}

export default Cart;