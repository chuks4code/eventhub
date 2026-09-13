// Import React tools for creating and using the cart
import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

// Create the Cart Context
const CartContext = createContext();

// Cart Provider controls all cart information
export function CartProvider({ children }) {

    // Get the ID of the currently logged-in user
    const getUserId = () => {

        // Get the saved user information
        const savedUser = localStorage.getItem("user");

        // If there is no logged-in user, use the guest cart
        if (!savedUser) {
            return "guest";
        }

        try {

            // Convert the saved user JSON into JavaScript
            const user = JSON.parse(savedUser);

            // Return the user's ID
            return user.id;

        } catch (error) {

            // If the saved user data is invalid,
            // use the guest cart
            return "guest";
        }
    };

    // Create a unique cart storage key for each user
    const getCartKey = () => {
        return `eventhub-cart-${getUserId()}`;
    };

    // Load the current user's cart from localStorage
    const loadCart = () => {

        // Get the correct cart key
        const cartKey = getCartKey();

        // Get the saved cart
        const savedCart = localStorage.getItem(cartKey);

        // Convert the saved JSON back into JavaScript
        return savedCart ? JSON.parse(savedCart) : [];
    };

    // Store the current user's cart in React state
    const [cart, setCart] = useState(loadCart);

    // Listen for login and logout changes
    useEffect(() => {

        // Reload the cart when the logged-in user changes
        const handleAuthChange = () => {

            // Load the new user's cart
            const userCart = loadCart();

            // Update React state
            setCart(userCart);
        };

        // Listen for our custom authentication event
        window.addEventListener(
            "eventhub-auth-changed",
            handleAuthChange
        );

        // Clean up the event listener
        return () => {
            window.removeEventListener(
                "eventhub-auth-changed",
                handleAuthChange
            );
        };

    }, []);

    // Save the cart to React state and the current user's localStorage
    const updateCart = (newCart) => {

        // Update the React cart
        setCart(newCart);

        // Get the current user's cart key
        const cartKey = getCartKey();

        // Save the cart in the browser
        localStorage.setItem(
            cartKey,
            JSON.stringify(newCart)
        );
    };

    // Add an event to the cart
    const addToCart = (event, quantity = 1) => {

        // Check whether this event is already in the cart
        const existingItem = cart.find(
            (item) =>
                String(item.id) === String(event.id)
        );

        // If the event is already in the cart,
        // increase its quantity
        if (existingItem) {

            const updatedCart = cart.map((item) =>
                String(item.id) === String(event.id)
                    ? {
                        ...item,
                        quantity:
                            item.quantity + quantity
                    }
                    : item
            );

            updateCart(updatedCart);

            return;
        }

        // Add a new event to the cart
        const newItem = {
            id: event.id,
            title: event.title,
            description: event.description,
            location: event.location,
            event_date: event.event_date,
            price: Number(event.price),
            quantity: quantity
        };

        updateCart([...cart, newItem]);
    };

    // Remove an event from the cart
    const removeFromCart = (eventId) => {

        const updatedCart = cart.filter(
            (item) =>
                String(item.id) !== String(eventId)
        );

        updateCart(updatedCart);
    };

    // Change the number of tickets for an event
    const updateQuantity = (eventId, quantity) => {

        // Make sure the quantity is at least 1
        if (quantity < 1) {
            return;
        }

        const updatedCart = cart.map((item) =>
            String(item.id) === String(eventId)
                ? {
                    ...item,
                    quantity: quantity
                }
                : item
        );

        updateCart(updatedCart);
    };

    // Empty the entire cart
    const clearCart = () => {
        updateCart([]);
    };

    // Calculate the total number of tickets
    const cartItemCount = cart.reduce(
        (total, item) =>
            total + item.quantity,
        0
    );

    // Calculate the total price
    const cartTotal = cart.reduce(
        (total, item) =>
            total +
            item.price * item.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartItemCount,
                cartTotal
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

// Custom hook for accessing the cart
export function useCart() {
    return useContext(CartContext);
}