# EventHub — Full-Stack Event Booking Platform

EventHub is a full-stack event booking and management platform that allows users to discover events, create and manage their own events, book tickets, add events to a personalized shopping cart, and securely complete payments through Stripe.

The project was built to demonstrate practical full-stack development skills including REST API development, authentication, database design, authorization, payment integration, frontend development, and secure handling of user data.

---

## 🚀 Project Overview

EventHub provides an end-to-end event management and ticket booking experience.

Users can:

- Browse available events
- View detailed event information
- Create their own events
- Edit events they created
- Delete their own events
- Add event tickets to a personal shopping cart
- Manage ticket quantities
- Complete payments through Stripe Sandbox
- View their bookings
- Sign in using email/password or Google
- Access their account securely using JWT authentication

The application uses ownership-based authorization so users can manage their own events without being able to modify events created by other users.

---

## 📸 Application Screenshots



![EventHub Events Page](screenshots\eventPage1.png)
![EventHub Events Page](screenshots\eventPage2.png)
![EventHub Events Page](screenshots\login.png)
![EventHub Events Page](screenshots\MyBooking.png)
![EventHub Events Page](screenshots\organizerDashboard.png)
![EventHub Events Page](screenshots\registerPage.png)
![EventHub Events Page](screenshots\StripPayment.png)
![EventHub Events Page](screenshots\StripPaymentConfirmation.png)
![EventHub Events Page](screenshots\ViewEvent.png)


## 🎯 Project Goals

---

The main goals of EventHub were to build a realistic full-stack application that demonstrates:

- Frontend and backend integration
- RESTful API design
- Relational database design
- Secure authentication
- Authorization and resource ownership
- Third-party API integration
- Payment processing
- Webhook handling
- User-specific application data
- CRUD operations
- Error handling
- Responsive UI design
- Environment variable and secret management

---

## 🛠️ Technology Stack

### Frontend

- React
- Vite
- React Router
- JavaScript
- CSS
- Fetch API
- Local Storage

### Backend

- Node.js
- Express.js
- REST APIs
- JWT Authentication
- bcryptjs
- Google OAuth / Google Identity Services
- Stripe API

### Database

- PostgreSQL
- SQL
- pgAdmin 4

### Development Tools

- Visual Studio Code
- Postman
- Git
- GitHub
- PowerShell

---

## 🏗️ Application Architecture

EventHub follows a client-server architecture.

```text
                 ┌──────────────────────┐
                 │      React / Vite    │
                 │      Frontend        │
                 └──────────┬───────────┘
                            │
                       HTTP / REST
                            │
                            ▼
                 ┌──────────────────────┐
                 │   Node.js / Express  │
                 │      Backend API     │
                 └───────┬───────┬──────┘
                         │       │
                ┌────────┘       └─────────┐
                ▼                          ▼
       ┌─────────────────┐       ┌─────────────────┐
       │   PostgreSQL    │       │     Stripe      │
       │    Database     │       │   Payments      │
       └─────────────────┘       └─────────────────┘