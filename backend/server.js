

const express = require("express");       // Import Express
const cors = require("cors");             // Import CORS
require("dotenv").config();               // Load variables from .env

const pool = require("./db/database");      // Import the database connection pool for current file to use
const Stripe = require("stripe");

const bcrypt = require("bcryptjs");       // Hash and verify passwords
const jwt = require("jsonwebtoken");        // Create and verify JWT tokens
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

// Create a Stripe client using the secret key stored in .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


const app = express();                    // Create Express application


 // Enable CORS
app.use(cors());

// ==========================================
// STRIPE WEBHOOK
// ==========================================

// Stripe webhook must receive the raw request body
app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {

        // Get the Stripe signature from the request
        const signature = req.headers["stripe-signature"];

        try {

            // Verify that the webhook actually came from Stripe
            const event = stripe.webhooks.constructEvent(
                req.body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );

            // Handle a successful Stripe Checkout payment
            if (event.type === "checkout.session.completed") {

                // Get the Stripe Checkout session
                const session = event.data.object;

                // Make sure the payment was actually completed
                if (session.payment_status !== "paid") {

                    console.log(
                        "Checkout completed, but payment is not marked as paid."
                    );

                    return res.json({
                        received: true
                    });
                }

                // ------------------------------------------
                // GET BOOKING IDs FROM STRIPE METADATA
                // ------------------------------------------

                let bookingIds = [];

                // New cart checkout stores multiple booking IDs
                if (session.metadata.bookingIds) {

                    // Convert:
                    // "12,13,14"
                    //
                    // into:
                    // ["12", "13", "14"]

                    bookingIds =
                        session.metadata.bookingIds
                            .split(",")
                            .filter(Boolean);

                }

                // Support the existing single-event checkout
                // that stores only one booking ID
                else if (session.metadata.bookingId) {

                    bookingIds = [
                        session.metadata.bookingId
                    ];
                }

                // Make sure we actually received booking IDs
                if (bookingIds.length === 0) {

                    console.log(
                        "No booking IDs found in Stripe metadata."
                    );

                    return res.json({
                        received: true
                    });
                }

                // Convert booking IDs from strings to numbers
                const numericBookingIds =
                    bookingIds.map(Number);

                // ------------------------------------------
                // CONFIRM ALL BOOKINGS
                // ------------------------------------------

                const bookingResult = await pool.query(
                    `UPDATE bookings
                     SET status = 'confirmed'
                     WHERE id = ANY($1::int[])
                     AND status = 'pending'
                     RETURNING id`,
                    [numericBookingIds]
                );

                // Display which bookings were confirmed
                if (bookingResult.rows.length > 0) {

                    const confirmedIds =
                        bookingResult.rows.map(
                            (booking) => booking.id
                        );

                    console.log(
                        `Bookings confirmed successfully: ${confirmedIds.join(", ")}`
                    );

                } else {

                    console.log(
                        "No pending bookings were found to confirm."
                    );
                }
            }

            // Tell Stripe that the webhook was received
            // successfully
            res.json({
                received: true
            });

        } catch (error) {

            // Display the webhook error in the backend console
            console.error(
                "Webhook error:",
                error.message
            );

            // Tell Stripe the webhook failed
            res.status(400).send(
                `Webhook Error: ${error.message}`
            );
        }
    }
);

// Normal JSON requests ,Allow JSON request data
app.use(express.json());


// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"]; // Get authorization header

    const token = authHeader && authHeader.split(" ")[1]; // Get token from header

    if (!token) { // Check if token exists
        return res.status(401).json({
            message: "Access token required"
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => { // Verify token
        if (error) { // Check if token is invalid or expired
            return res.status(403).json({
                message: "Invalid or expired token"
            });
        }

        req.user = user; // Store user information in request

        next(); // Continue to the next function
    });
}

// Only allow users with the organizer role
async function requireOrganizer(req, res, next) {

    try {

        // Get the logged-in user's role from the database
        const result = await pool.query(
            "SELECT role FROM users WHERE id = $1",
            [req.user.userId]
        );

        // Make sure the user exists
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Check whether the logged-in user is an organizer
        if (result.rows[0].role !== "organizer") {
            return res.status(403).json({
                message: "Organizer access required"
            });
        }

        // User is an organizer, so continue
        next();

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to verify organizer access"
        });
    }
}

// Protected route
app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query( // Get logged-in user from database
            "SELECT id, name, email, role FROM users WHERE id = $1",
            [req.user.userId]
        );

        if (result.rows.length === 0) { // Check if user exists
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json(result.rows[0]); // Send user information

    } catch (error) {
        console.error(error); // Show error in console

        res.status(500).json({ // Send error response
            message: "Failed to get user"
        });
    }
});

// Test API
app.get("/", (req, res) => {              // Create GET route for "/"
    res.json({                             // Send a JSON response
        message: "EventHub API is running!" // Message sent to the client
    });
});


// Test PostgreSQL database connection
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()"); // Run a simple query to check if PostgreSQL is responding

        res.json({ // Send a successful response to the client
            message: "PostgreSQL connected!", // Confirmation message
            time: result.rows[0].now // Get the current database time
        });

    } catch (error) {
        console.error(error); // Log the database error to the console

        res.status(500).json({ // Send an error response with status code 500
            message: "Database connection failed" // Error message
        });
    }
});

// Get all events
app.get("/api/events", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM events ORDER BY event_date ASC"
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve events"
        });
    }
});

// Get one event by ID
app.get("/api/events/:id", async (req, res) => { // Define GET endpoint with event ID as a URL parameter
    try {
        const { id } = req.params; // Get the event ID from the URL

        const result = await pool.query( // Send a query to PostgreSQL
            "SELECT * FROM events WHERE id = $1", // Find the event whose ID matches the provided ID
            [id] // Pass the ID safely as a parameter to prevent SQL injection
        );

        if (result.rows.length === 0) { // Check if no event was found
            return res.status(404).json({ // Return HTTP 404 Not Found
                message: "Event not found" // Send an error message to the client
            });
        }

        res.json(result.rows[0]); // Return the first matching event as JSON

    } catch (error) {
        console.error(error); // Log the error to the server console

        res.status(500).json({ // Return HTTP 500 Internal Server Error
            message: "Failed to retrieve event" // Send an error message to the client
        });
    }
});


// ==========================================
// CREATE A NEW EVENT
// ==========================================

// Any logged-in user can create events
app.post(
    "/api/events",
    authenticateToken,
    async (req, res) => {
        try {
            //  Get the logged-in user's ID from the JWT
            const userId = req.user.userId;

            // Extract event information from the request body
            const {
                title,
                description,
                location,
                event_date,
                price,
                capacity,
                image_url
            } = req.body;

            // Create the event and save who created it
            const result = await pool.query(
                `INSERT INTO events
                (
                    title,
                    description,
                    location,
                    event_date,
                    price,
                    capacity,
                    image_url,
                    created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *`,
                [
                    title,
                    description,
                    location,
                    event_date,
                    price,
                    capacity,
                    image_url,
                    userId
                ]
            );

            // Return the newly created event
            res.status(201).json(result.rows[0]);

        } catch (error) {
            // Log the database or server error
            console.error(error);

            // Return an error response
            res.status(500).json({
                message: "Failed to create event"
            });
        }
    }
);

// ==========================================
// GET USER'S EVENTS
// ==========================================

// Only logged-in users can view their own events
app.get(
    "/api/organizer/events",
    authenticateToken,
    async (req, res) => {
        try {
            // Get the organizer's ID from the JWT
            const userId = req.user.userId;

            // Get only events created by this organizer
            const result = await pool.query(
                `SELECT *
                 FROM events
                 WHERE created_by = $1
                 ORDER BY event_date ASC`,
                [userId]
            );

            // Return the organizer's events
            res.json(result.rows);

        } catch (error) {
            // Display the error in the backend console
            console.error(error);

            // Return a server error
            res.status(500).json({
                message: "Failed to retrieve organizer events"
            });
        }
    }
);

// ==========================================
// UPDATE USER'S EVENT
// ==========================================

// Only logged-in users can update events
app.put(
    "/api/events/:id",
    authenticateToken,
    async (req, res) => {
        try {
            // Get the event ID from the URL
            const { id } = req.params;

            // Get the logged-in user's ID from the JWT
            const userId = req.user.userId;

            // Get the updated event information
            const {
                title,
                description,
                location,
                event_date,
                price,
                capacity,
                image_url
            } = req.body;

            // Update the event only if it belongs
            // to the logged-in user
            const result = await pool.query(
                `UPDATE events
                 SET title = $1,
                     description = $2,
                     location = $3,
                     event_date = $4,
                     price = $5,
                     capacity = $6,
                     image_url = $7
                 WHERE id = $8
                 AND created_by = $9
                 RETURNING *`,
                [
                    title,
                    description,
                    location,
                    event_date,
                    price,
                    capacity,
                    image_url,
                    id,
                    userId
                ]
            );

            // Check whether the event exists
            // and belongs to this user
            if (result.rows.length === 0) {
                return res.status(404).json({
                    message:
                        "Event not found or you do not own this event"
                });
            }

            // Return the updated event
            res.json(result.rows[0]);

        } catch (error) {
            // Display the error in the backend console
            console.error(error);

            // Return a server error
            res.status(500).json({
                message: "Failed to update event"
            });
        }
    }
);


// ==========================================
// DELETE USER'S EVENT
// ==========================================

// Only logged-in userss can delete events
app.delete(
    "/api/events/:id",
    authenticateToken,
    async (req, res) => {

        try {

            // Get the event ID from the URL
            const { id } = req.params;

            // Get the logged-in user's ID from the JWT
            const userId = req.user.userId;

            // Delete the event only if it belongs
            // to the logged-in user
            const result = await pool.query(
                `DELETE FROM events
                 WHERE id = $1
                 AND created_by = $2
                 RETURNING *`,
                [
                    id,
                    userId
                ]
            );

            // Check whether the event exists
            // and belongs to this organizer
            if (result.rows.length === 0) {
                return res.status(404).json({
                    message:
                        "Event not found or you do not own this event"
                });
            }

            // Return a success message
            res.json({
                message: "Event deleted successfully",
                event: result.rows[0]
            });

        } catch (error) {

            // Display the error in the backend console
            console.error(error);

            // Return a server error
            res.status(500).json({
                message: "Failed to delete event"
            });
        }
    }
);

// Register a new user
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, role, created_at`,
            [name, email, passwordHash]
        );

        // Create login token
        const token = jwt.sign(
            { userId: result.rows[0].id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0],
            token
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Registration failed"
        });
    }
});

// Login user
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body; // Get login details

        const result = await pool.query( // Search for user
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) { // Check if user exists
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0]; // Get user from database


        

        const passwordMatch = await bcrypt.compare( // Compare passwords
            password,
            user.password_hash
        );

        if (!passwordMatch) { // Check if password is correct
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign( // Create login token
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ // Send login response
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });

    } catch (error) {
        console.error(error); // Show error in console

        res.status(500).json({ // Send error response
            message: "Login failed"
        });
    }
});

// Google login
app.post("/api/auth/google", async (req, res) => {
    try {
        const { credential } = req.body; // Get Google credential

        if (!credential) { // Check if credential exists
            return res.status(400).json({
                message: "Google credential required"
            });
        } 

        const ticket = await googleClient.verifyIdToken({ // Verify Google token
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload(); // Get Google user information

        const googleId = payload.sub; // Get Google user ID
        const email = payload.email; // Get Google email
        const name = payload.name; // Get Google name

        let result = await pool.query( // Find user by Google ID
            "SELECT id, name, email, role, google_id FROM users WHERE google_id = $1",
            [googleId]
        );

        let user; // Store user information

        if (result.rows.length === 0) { // Check if Google user exists

            result = await pool.query( // Find existing user by email
                `SELECT id, name, email, role, google_id
                 FROM users
                 WHERE email = $1`,
                [email]
            );

            if (result.rows.length > 0) { // Existing account found
                user = result.rows[0]; // Get existing user

                await pool.query( // Link Google account to user
                    "UPDATE users SET google_id = $1 WHERE id = $2",
                    [googleId, user.id]
                );

            } else { // No existing account found

                result = await pool.query( // Create new user
                    `INSERT INTO users (name, email, google_id)
                     VALUES ($1, $2, $3)
                     RETURNING id, name, email, role, google_id`,
                    [name, email, googleId]
                );

                user = result.rows[0]; // Get newly created user
            }

        } else {
            user = result.rows[0]; // Get existing Google user
        }

        const token = jwt.sign( // Create JWT token
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ // Send login response
            message: "Google login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });

    } catch (error) {
        console.error(error); // Show error in console

        res.status(401).json({ // Send authentication error
            message: "Google authentication failed"
        });
    }
});

// ==========================================
// CREATE EVENT BOOKING
// ==========================================

app.post("/api/bookings", authenticateToken, async (req, res) => {
    try {
        // Get the event ID and quantity from the request
        const { eventId, quantity } = req.body;

        // Get the logged-in user's ID from the JWT
        const userId = req.user.userId;

        // Make sure an event ID was provided
        if (!eventId) {
            return res.status(400).json({
                message: "Event ID is required"
            });
        }

        // Make sure quantity is a positive number
        if (!quantity || quantity < 1) {
            return res.status(400).json({
                message: "Quantity must be at least 1"
            });
        }

        // Find the event in the database
        const eventResult = await pool.query(
            `SELECT id, title, price, capacity
             FROM events
             WHERE id = $1`,
            [eventId]
        );

        // Check whether the event exists
        if (eventResult.rows.length === 0) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        const event = eventResult.rows[0];

        // Check how many tickets have already been booked
        const bookingResult = await pool.query(
            `SELECT COALESCE(SUM(quantity), 0) AS booked_quantity
             FROM bookings
             WHERE event_id = $1
             AND status != 'cancelled'`,
            [eventId]
        );

        const bookedQuantity = Number(
            bookingResult.rows[0].booked_quantity
        );

        // Make sure there is enough capacity
        if (bookedQuantity + quantity > event.capacity) {
            return res.status(400).json({
                message: "Not enough spots available"
            });
        }

        // Calculate the total booking amount
        const totalAmount = Number(event.price) * quantity;

        // Create the booking
        const result = await pool.query(
            `INSERT INTO bookings
                (user_id, event_id, quantity, total_amount, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                userId,
                eventId,
                quantity,
                totalAmount,
                "pending"
            ]
        );

        // Return the newly created booking
        res.status(201).json({
            message: "Event booking created successfully",
            booking: result.rows[0]
        });

    } catch (error) {
        // Display the error in the backend console
        console.error(error);

        // Handle duplicate booking attempts
        if (error.code === "23505") {
            return res.status(409).json({
                message: "You have already booked this event"
            });
        }

        // Return a general server error
        res.status(500).json({
            message: "Failed to create booking"
        });
    }
});


// Create a Stripe Checkout session for an event booking
app.post(
    "/api/payments/create-checkout-session",
    authenticateToken,
    async (req, res) => {

        try {
            const { eventId, quantity } = req.body;
            const userId = req.user.userId;

            // Validate the event ID
            if (!eventId) {
                return res.status(400).json({
                    message: "Event ID is required"
                });
            }

            // Validate the ticket quantity
            if (!quantity || quantity < 1) {
                return res.status(400).json({
                    message: "Quantity must be at least 1"
                });
            }

            // Get the event from PostgreSQL
            const eventResult = await pool.query(
                `SELECT id, title, description, price, capacity
                 FROM events
                 WHERE id = $1`,
                [eventId]
            );

            if (eventResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Event not found"
                });
            }

            const event = eventResult.rows[0];

            // Check whether this user already has a booking
            const existingBookingResult = await pool.query(
                `SELECT id, quantity, status
                 FROM bookings
                 WHERE user_id = $1
                 AND event_id = $2`,
                [userId, eventId]
            );

            const existingBooking = existingBookingResult.rows[0];

            // Do not allow another payment for an already confirmed booking
            if (existingBooking && existingBooking.status === "confirmed") {
                return res.status(400).json({
                    message: "You have already booked this event"
                });
            }

            // Calculate how many tickets are already reserved.
            // If there is an existing pending booking, exclude it because
            // we may be updating its quantity below.
            const bookingResult = await pool.query(
                `SELECT COALESCE(SUM(quantity), 0) AS booked_quantity
                 FROM bookings
                 WHERE event_id = $1
                 AND status != 'cancelled'
                 AND id != COALESCE($2, 0)`,
                [eventId, existingBooking ? existingBooking.id : null]
            );

            const bookedQuantity = Number(
                bookingResult.rows[0].booked_quantity
            );

            // Make sure there are enough tickets available
            if (bookedQuantity + Number(quantity) > Number(event.capacity)) {
                return res.status(400).json({
                    message: "Not enough spots available"
                });
            }

            let bookingId;
           

            // If a pending booking already exists, update it
            if (existingBooking && existingBooking.status === "pending") {

                const totalAmount =
                    Number(event.price) * Number(quantity);

                await pool.query(
                    `UPDATE bookings
                     SET quantity = $1,
                         total_amount = $2
                     WHERE id = $3`,
                    [
                        quantity,
                        totalAmount,
                        existingBooking.id
                    ]
                );

                bookingId = existingBooking.id;

            } else {

                // Create a new pending booking before sending
                // the customer to Stripe Checkout
                const totalAmount =
                    Number(event.price) * Number(quantity);

                const bookingInsert = await pool.query(
                    `INSERT INTO bookings
                     (user_id, event_id, quantity, total_amount, status)
                     VALUES ($1, $2, $3, $4, 'pending')
                     RETURNING id`,
                    [
                        userId,
                        eventId,
                        quantity,
                        totalAmount
                    ]
                );

                bookingId = bookingInsert.rows[0].id;
               
            }

            // Create the Stripe Checkout session
            const session = await stripe.checkout.sessions.create({
                mode: "payment",

                line_items: [
                    {
                        price_data: {
                            currency: "cad",

                            product_data: {
                                name: event.title,
                                description: event.description
                            },

                            // Stripe expects the amount in cents
                            unit_amount: Math.round(
                                Number(event.price) * 100
                            )
                        },

                        quantity: Number(quantity)
                    }
                ],

                success_url:
                    "http://localhost:5173/payment-success",

                cancel_url:
                    `http://localhost:5173/events/${eventId}`,

                metadata: {
                    // This lets the webhook identify the exact booking
                    bookingId: String(bookingId),

                    userId: String(userId),

                    eventId: String(eventId),

                    quantity: String(quantity)
                }
            });

            // Send the Stripe Checkout URL back to React
            res.json({
                url: session.url
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Failed to create Stripe Checkout session"
            });
        }
    }
);

  // ==========================================
// CREATE STRIPE CHECKOUT FOR ENTIRE CART
// ==========================================

app.post(
    "/api/payments/create-cart-checkout-session",
    authenticateToken,
    async (req, res) => {

        try {

            // Get the cart items sent from React
            const { items } = req.body;

            // Get the logged-in user's ID from the JWT
            const userId = req.user.userId;

            // Make sure the cart contains items
            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    message: "Your cart is empty"
                });
            }

            // Store Stripe products for this checkout session
            const lineItems = [];

            // Store the booking IDs that will be connected
            // to this Stripe payment
            const bookingIds = [];

            // Process every event in the cart
            for (const item of items) {

                // Get the event ID and quantity
                const { eventId, quantity } = item;

                // Validate the event ID
                if (!eventId) {
                    return res.status(400).json({
                        message: "Event ID is required"
                    });
                }

                // Validate the quantity
                if (!quantity || quantity < 1) {
                    return res.status(400).json({
                        message: "Ticket quantity must be at least 1"
                    });
                }

                // Get the real event information from PostgreSQL
                const eventResult = await pool.query(
                    `SELECT
                        id,
                        title,
                        description,
                        price,
                        capacity
                     FROM events
                     WHERE id = $1`,
                    [eventId]
                );

                // Make sure the event still exists
                if (eventResult.rows.length === 0) {
                    return res.status(404).json({
                        message: `Event ${eventId} not found`
                    });
                }

                const event = eventResult.rows[0];

                // Check whether this user already has a booking
                const existingBookingResult = await pool.query(
                    `SELECT id, quantity, status
                     FROM bookings
                     WHERE user_id = $1
                     AND event_id = $2`,
                    [userId, eventId]
                );

                const existingBooking =
                    existingBookingResult.rows[0];

                // Do not allow the user to purchase an event
                // that they have already successfully booked
                if (
                    existingBooking &&
                    existingBooking.status === "confirmed"
                ) {
                    return res.status(400).json({
                        message:
                            `You have already booked "${event.title}"`
                    });
                }

                // Calculate how many tickets are already reserved
                // by other bookings
                const bookingResult = await pool.query(
                    `SELECT COALESCE(SUM(quantity), 0)
                        AS booked_quantity
                     FROM bookings
                     WHERE event_id = $1
                     AND status != 'cancelled'
                     AND id != COALESCE($2, 0)`,
                    [
                        eventId,
                        existingBooking
                            ? existingBooking.id
                            : null
                    ]
                );

                const bookedQuantity = Number(
                    bookingResult.rows[0].booked_quantity
                );

                // Make sure enough tickets are available
                if (
                    bookedQuantity + Number(quantity)
                    > Number(event.capacity)
                ) {
                    return res.status(400).json({
                        message:
                            `Not enough spots available for "${event.title}"`
                    });
                }

                // Calculate the booking total
                const totalAmount =
                    Number(event.price) * Number(quantity);

                let bookingId;

                // If the user already has a pending booking,
                // update it instead of creating a duplicate
                if (
                    existingBooking &&
                    existingBooking.status === "pending"
                ) {

                    await pool.query(
                        `UPDATE bookings
                         SET quantity = $1,
                             total_amount = $2
                         WHERE id = $3`,
                        [
                            quantity,
                            totalAmount,
                            existingBooking.id
                        ]
                    );

                    bookingId = existingBooking.id;

                } else {

                    // Create a new pending booking
                    const bookingInsert = await pool.query(
                        `INSERT INTO bookings
                            (
                                user_id,
                                event_id,
                                quantity,
                                total_amount,
                                status
                            )
                         VALUES ($1, $2, $3, $4, 'pending')
                         RETURNING id`,
                        [
                            userId,
                            eventId,
                            quantity,
                            totalAmount
                        ]
                    );

                    bookingId = bookingInsert.rows[0].id;
                }

                // Save the booking ID so the webhook
                // can confirm it after payment
                bookingIds.push(String(bookingId));

                // Add this event to the Stripe Checkout
                lineItems.push({
                    price_data: {

                        // Charge the customer in Canadian dollars
                        currency: "cad",

                        product_data: {
                            name: event.title,
                            description: event.description
                        },

                        // Stripe expects the price in cents
                        unit_amount: Math.round(
                            Number(event.price) * 100
                        )
                    },

                    // Number of tickets
                    quantity: Number(quantity)
                });
            }

            // Create ONE Stripe Checkout session
            // containing all events in the cart
            const session =
                await stripe.checkout.sessions.create({

                    mode: "payment",

                    // Send all cart events to Stripe
                    line_items: lineItems,

                    // Return the customer to EventHub
                    // after successful payment
                    success_url:
                        "http://localhost:5173/payment-success",

                    // Return the customer to the cart
                    // if they cancel payment
                    cancel_url:
                        "http://localhost:5173/cart",

                    // Store all booking IDs in Stripe metadata
                    // separated by commas
                    metadata: {
                        bookingIds:
                            bookingIds.join(","),
                        userId: String(userId)
                    }
                });

            // Send the Stripe Checkout URL back to React
            res.json({
                url: session.url
            });

        } catch (error) {

            // Display the technical error in the backend console
            console.error(
                "Cart checkout error:",
                error
            );

            // Send a user-friendly error
            res.status(500).json({
                message:
                    "Failed to create cart checkout session"
            });
        }
    }
);

// ==========================================
// GET LOGGED-IN USER'S BOOKINGS
// ==========================================

app.get("/api/bookings", authenticateToken, async (req, res) => {
    try {
        // Get the logged-in user's ID from the JWT
        const userId = req.user.userId;

        // Get this user's bookings and the related event information
        const result = await pool.query(
            `SELECT
                b.id,
                b.event_id,
                b.quantity,
                b.total_amount,
                b.status,
                b.created_at,
                e.title,
                e.description,
                e.location,
                e.event_date,
                e.image_url
             FROM bookings b
             JOIN events e ON b.event_id = e.id
             WHERE b.user_id = $1
             ORDER BY b.created_at DESC`,
            [userId]
        );

        // Return the user's bookings
        res.json(result.rows);

    } catch (error) {
        // Display the error in the backend console
        console.error(error);

        // Return a server error
        res.status(500).json({
            message: "Failed to retrieve bookings"
        });
    }
});



const PORT = process.env.PORT || 5000;    // Get PORT from .env, or use 5000

app.listen(PORT, () => {                   // Start server on the selected port
    console.log(`Server running on port ${PORT}`); // Display server status
});



