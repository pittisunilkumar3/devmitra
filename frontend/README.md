# Book A Developer - Frontend

This is the frontend application for the Book A Developer platform, built with Next.js 15 and TypeScript.

## Features

- Modern React with Server Components
- TypeScript for type safety
- Tailwind CSS for styling
- Authentication with JWT
- Role-based dashboard (Super Admin, Developer, User)
- Responsive design

## Prerequisites

- Node.js (v18+)
- Backend API running on port 5000

## Installation

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Configure environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local if needed
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

The application will run on port 3000 by default.

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   ├── superadmin/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── developers/
│   │   ├── bookings/
│   │   └── tickets/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
├── context/
│   └── AuthContext.tsx
├── lib/
│   └── api.ts
└── types/
    └── index.ts
```

## Pages

### Public Pages
- `/` - Landing page
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/developers` - Browse developers (public)

### Super Admin Pages
- `/superadmin/dashboard` - Admin dashboard
- `/superadmin/users` - User management
- `/superadmin/developers` - Developer management & approval
- `/superadmin/bookings` - Booking management
- `/superadmin/tickets` - Support ticket management

### Developer Pages
- `/developer/dashboard` - Developer dashboard
- `/developer/onboarding` - Developer onboarding form
- `/developer/bookings` - Developer's bookings

### User Pages
- `/user/dashboard` - User dashboard
- `/user/bookings` - User's bookings

## API Integration

The frontend connects to the backend API at `http://localhost:5000/api` by default.

All API calls are handled through the `api` client in `src/lib/api.ts`.

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:5000/api)
- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_APP_URL` - Application URL

## License

MIT
