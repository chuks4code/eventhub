
// Import React tools
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Import React Router
import { BrowserRouter } from "react-router-dom";

// Import the Cart Provider
import { CartProvider } from "./CartContext.jsx";

// Import global styles
import "./index.css";

// Import the main application
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <CartProvider>
                <App />
            </CartProvider>
        </BrowserRouter>
    </StrictMode>
);