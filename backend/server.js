

const express = require("express");       // Import Express
const cors = require("cors");             // Import CORS
require("dotenv").config();               // Load variables from .env

const pool = require("./db/database");      // Import the database connection pool for current file to use

const bcrypt = require("bcryptjs");       // Hash and verify passwords
const jwt = require("jsonwebtoken");        // Create and verify JWT tokens
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);


const app = express();                    // Create Express application

app.use(cors());                          // Enable CORS
app.use(express.json());                  // Allow JSON request data

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


// Create a new event
app.post("/api/events", async (req, res) => { // Define POST endpoint for creating a new event
    try {
        const { // Extract event information from the request body
            title, // Event title
            description, // Event description
            location, // Event location
            event_date, // Date and time of the event
            price, // Event price
            capacity, // Maximum number of attendees
            image_url // URL of the event image
        } = req.body; // Get the submitted data from the client

         const result = await pool.query(
            `INSERT INTO events
            (title, description, location, event_date, price, capacity, image_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                title,
                description,
                location,
                event_date,
                price,
                capacity,
                image_url
            ]
        );

        res.status(201).json(result.rows[0]); // Return the newly created event with HTTP 201 Created

    } catch (error) {
        console.error(error); // Log the database or server error

        res.status(500).json({ // Return HTTP 500 Internal Server Error
            message: "Failed to create event" // Send an error message to the client
        });
    }
});

// Update an event
app.put("/api/events/:id", async (req, res) => {
    try {
        const { id } = req.params; // Get the event ID from the URL
        const {
            title,
            description,
            location,
            event_date,
            price,
            capacity,
            image_url
        } = req.body;

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
             RETURNING *`,
            [
                title,
                description,
                location,
                event_date,
                price,
                capacity,
                image_url,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to update event"
        });
    }
});

// Delete an event
app.delete("/api/events/:id", async (req, res) => {
    try {
        const { id } = req.params; // Get the event ID from the URL

        const result = await pool.query(
            "DELETE FROM events WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.json({
            message: "Event deleted successfully",
            event: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to delete event"
        });
    }
});

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



