# Book A Developer - Backend API

This is the backend API for the Book A Developer platform, built with Express.js and TypeScript.

## Features

- User authentication (JWT)
- Role-based access control (Super Admin, Developer, User)
- Developer onboarding and approval system
- Booking management with milestones
- Support ticket system
- RESTful API endpoints

## Prerequisites

- Node.js (v18+)
- MySQL (v8+)

## Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Create MySQL database:
```sql
CREATE DATABASE book_a_developer;
```

4. Run migrations:
```bash
npm run db:migrate
```

5. (Optional) Seed the database:
```bash
npm run db:seed
```

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

The server will run on port 5000 by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/block` - Block user
- `PUT /api/users/:id/unblock` - Unblock user
- `GET /api/users/stats` - Get user statistics

### Developers
- `GET /api/developers/browse` - Browse approved developers (public)
- `GET /api/developers` - Get all developers (admin)
- `GET /api/developers/:id` - Get developer by ID
- `POST /api/developers` - Create developer profile
- `PUT /api/developers/:id` - Update developer profile
- `PUT /api/developers/:id/approve` - Approve developer (admin)
- `PUT /api/developers/:id/reject` - Reject developer (admin)
- `GET /api/developers/stats` - Get developer statistics

### Bookings
- `GET /api/bookings` - Get all bookings (admin)
- `GET /api/bookings/my` - Get user's/developer's bookings
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking (admin)
- `PUT /api/bookings/:id/accept` - Accept booking (developer)
- `PUT /api/bookings/:id/decline` - Decline booking (developer)
- `PUT /api/bookings/:id/complete` - Complete booking
- `GET /api/bookings/stats` - Get booking statistics

### Support Tickets
- `GET /api/tickets` - Get all tickets (admin)
- `GET /api/tickets/my` - Get user's tickets
- `GET /api/tickets/:id` - Get ticket by ID
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id/status` - Update ticket status (admin)
- `PUT /api/tickets/:id/priority` - Update ticket priority (admin)
- `PUT /api/tickets/:id/assign` - Assign ticket (admin)
- `POST /api/tickets/:id/messages` - Add message to ticket
- `GET /api/tickets/stats` - Get ticket statistics

## Project Structure

```
src/
├── config/
│   └── database.ts      # Database connection
├── controllers/
│   ├── AuthController.ts
│   ├── UserController.ts
│   ├── DeveloperController.ts
│   ├── BookingController.ts
│   └── SupportTicketController.ts
├── middleware/
│   └── auth.ts          # Authentication middleware
├── models/
│   ├── User.ts
│   ├── Developer.ts
│   ├── Booking.ts
│   ├── SupportTicket.ts
│   ├── Review.ts
│   └── Transaction.ts
├── migrations/
│   ├── 001_create_initial_schema.ts
│   ├── 002_create_seed_data.ts
│   └── run.ts
├── routes/
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── developer.routes.ts
│   ├── booking.routes.ts
│   └── ticket.routes.ts
├── types/
│   └── index.ts
└── server.ts
```

## Default Credentials

After running the seed, these accounts are created:

- **Super Admin**: admin@bookadeveloper.com / admin123
- **Developer**: developer@example.com / dev123456
- **User**: user@example.com / user123456

## License

MIT
