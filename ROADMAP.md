# Book A Developer - Project Roadmap

## Overview
A platform where users can **book a developer in 10 minutes**. Users hire developers for projects, developers get clients. All communication is official and monitored - no sharing contact details without Super Admin permission.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js (React) |
| **Backend** | Next.js API Routes |
| **Database** | MySQL (phpMyAdmin) |
| **Authentication** | Email + Google OAuth |
| **Styling** | Tailwind CSS |
| **Payment** | Stripe / Razorpay (Dynamic) |

---

## Project Structure

```
book-a-developer/
├── app/
│   ├── (landing)/              # Public landing page
│   ├── (auth)/                 # Login, Register, Forgot Password
│   ├── superadmin/             # Super Admin panel
│   ├── developer/              # Developer panel
│   ├── user/                   # User panel
│   └── api/                    # Next.js API routes
├── components/
│   ├── shared/                 # Shared components
│   ├── superadmin/             # Admin components
│   ├── developer/              # Developer components
│   └── user/                   # User components
├── lib/
│   ├── db.ts                   # MySQL connection
│   ├── auth.ts                 # Authentication logic
│   └── middleware.ts           # Role-based access
├── public/
│   └── assets/
└── styles/
    └── globals.css
```

---

## Panels Overview

| Panel | Access | Description |
|-------|--------|-------------|
| **Landing Page** | Public | Homepage with features, pricing, CTA |
| **Super Admin** | Admin only | Full control - users, developers, bookings, settings |
| **Developer Panel** | Approved developers | Profile, bookings, earnings, support |
| **User Panel** | Registered users | Browse developers, book, track projects, support |

---

## Database Schema

### 1. users
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| email | VARCHAR | Unique email |
| password | VARCHAR | Hashed password |
| name | VARCHAR | Full name |
| role | ENUM | 'superadmin', 'developer', 'user' |
| status | ENUM | 'active', 'inactive', 'blocked' |
| profile_image | VARCHAR | Image URL |
| google_id | VARCHAR | Google OAuth ID |
| created_at | TIMESTAMP | Registration date |
| updated_at | TIMESTAMP | Last update |

### 2. developers
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| user_id | INT (FK) | Reference to users |
| skills | JSON | Array of skills |
| experience | INT | Years of experience |
| hourly_rate | DECIMAL | Rate per hour |
| availability | BOOLEAN | Available for booking |
| portfolio | TEXT | Portfolio links |
| rating | DECIMAL | Average rating |
| total_projects | INT | Completed projects |
| bio | TEXT | About developer |
| approval_status | ENUM | 'pending', 'approved', 'rejected' |
| rejected_reason | TEXT | Reason for rejection |
| approved_by | INT (FK) | Super Admin who approved |
| approved_at | TIMESTAMP | Approval date |
| rejection_count | INT | Number of times rejected |
| created_at | TIMESTAMP | Registration date |
| updated_at | TIMESTAMP | Last update |

### 3. bookings
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| booking_id | VARCHAR | Unique booking ID (BK-2026-0001) |
| user_id | INT (FK) | Client/User |
| developer_id | INT (FK) | Developer |
| status | ENUM | 'pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed' |
| project_title | VARCHAR | Project name |
| project_description | TEXT | Project details |
| project_type | VARCHAR | Type (Website, Mobile App, API, etc.) |
| budget | DECIMAL | Agreed amount |
| platform_fee | DECIMAL | Platform fee amount |
| developer_earnings | DECIMAL | Developer earnings after fee |
| deadline | DATE | Project deadline |
| started_at | TIMESTAMP | When work started |
| completed_at | TIMESTAMP | When work completed |
| cancelled_at | TIMESTAMP | When cancelled |
| cancelled_by | INT (FK) | Who cancelled |
| cancellation_reason | TEXT | Reason for cancellation |
| admin_notes | TEXT | Notes by Super Admin |
| priority | ENUM | 'low', 'medium', 'high', 'urgent' |
| payment_status | ENUM | 'pending', 'paid', 'refunded', 'partial' |
| created_at | TIMESTAMP | Booking date |
| updated_at | TIMESTAMP | Last update |

### 3.1 booking_milestones
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| booking_id | INT (FK) | Reference to booking |
| title | VARCHAR | Milestone title |
| description | TEXT | Milestone description |
| amount | DECIMAL | Milestone amount |
| status | ENUM | 'pending', 'in_progress', 'completed', 'approved' |
| due_date | DATE | Milestone deadline |
| completed_at | TIMESTAMP | Completion date |
| created_at | TIMESTAMP | Created date |

### 3.2 booking_files
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| booking_id | INT (FK) | Reference to booking |
| uploaded_by | INT (FK) | User who uploaded |
| file_name | VARCHAR | File name |
| file_url | VARCHAR | File URL |
| file_type | VARCHAR | File type |
| file_size | INT | File size in bytes |
| created_at | TIMESTAMP | Upload date |

### 3.3 booking_history
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| booking_id | INT (FK) | Reference to booking |
| action | VARCHAR | Action performed |
| performed_by | INT (FK) | User who performed |
| old_status | VARCHAR | Previous status |
| new_status | VARCHAR | New status |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMP | Action date |

### 4. messages (Booking Chat)
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| booking_id | INT (FK) | Reference to booking |
| sender_id | INT (FK) | Sender user ID |
| receiver_id | INT (FK) | Receiver user ID |
| message | TEXT | Message content |
| has_contact_info | BOOLEAN | Detected contact info |
| is_flagged | BOOLEAN | Flagged by system |
| created_at | TIMESTAMP | Message time |

### 4.1 support_tickets
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| ticket_id | VARCHAR | Unique ticket ID (TKT-2026-0001) |
| user_id | INT (FK) | User/Developer who created ticket |
| user_role | ENUM | 'user' or 'developer' |
| subject | VARCHAR | Ticket subject |
| category | ENUM | 'general', 'booking_issue', 'payment_issue', 'dispute', 'technical', 'other' |
| priority | ENUM | 'low', 'medium', 'high', 'urgent' |
| status | ENUM | 'open', 'in_progress', 'waiting_reply', 'resolved', 'closed' |
| assigned_to | INT (FK) | Super Admin assigned |
| related_booking_id | INT (FK) | Related booking (if any) |
| created_at | TIMESTAMP | Ticket created date |
| updated_at | TIMESTAMP | Last update |
| resolved_at | TIMESTAMP | Resolution date |
| closed_at | TIMESTAMP | Closed date |

### 4.2 support_ticket_messages
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| ticket_id | INT (FK) | Reference to support ticket |
| sender_id | INT (FK) | Sender (user/developer/superadmin) |
| sender_role | ENUM | 'user', 'developer', 'superadmin' |
| message | TEXT | Message content |
| attachments | JSON | Array of file URLs |
| is_internal | BOOLEAN | Internal note (only for admins) |
| created_at | TIMESTAMP | Message time |

### 5. transactions
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| booking_id | INT (FK) | Reference to booking |
| user_id | INT (FK) | Payer |
| developer_id | INT (FK) | Receiver |
| amount | DECIMAL | Transaction amount |
| platform_fee | DECIMAL | Platform commission |
| status | ENUM | 'pending', 'completed', 'refunded' |
| payment_id | VARCHAR | Payment gateway ID |
| created_at | TIMESTAMP | Transaction date |

### 6. reviews
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| booking_id | INT (FK) | Reference to booking |
| user_id | INT (FK) | Reviewer |
| developer_id | INT (FK) | Being reviewed |
| rating | INT | 1-5 stars |
| review | TEXT | Review text |
| created_at | TIMESTAMP | Review date |

### 7. admin_logs
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| admin_id | INT (FK) | Super Admin |
| action | VARCHAR | Action performed |
| target_id | INT | Affected user/record |
| details | TEXT | Action details |
| created_at | TIMESTAMP | Log time |

### 8. payment_gateways
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| name | VARCHAR | Gateway name (stripe, razorpay, paypal) |
| display_name | VARCHAR | Display name |
| api_key | VARCHAR | API Key (encrypted) |
| api_secret | VARCHAR | API Secret (encrypted) |
| webhook_secret | VARCHAR | Webhook secret (encrypted) |
| is_active | BOOLEAN | On/Off status |
| is_test_mode | BOOLEAN | Test/Live mode |
| platform_fee_percent | DECIMAL | Platform fee for this gateway |
| additional_config | JSON | Extra settings |
| created_at | TIMESTAMP | Created date |
| updated_at | TIMESTAMP | Last updated |

### 9. sms_providers
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| name | VARCHAR | Provider name (twilio, msg91, textlocal) |
| display_name | VARCHAR | Display name |
| api_key | VARCHAR | API Key (encrypted) |
| api_secret | VARCHAR | API Secret (encrypted) |
| sender_id | VARCHAR | Sender ID |
| is_active | BOOLEAN | On/Off status |
| is_test_mode | BOOLEAN | Test/Live mode |
| additional_config | JSON | Extra settings |
| created_at | TIMESTAMP | Created date |
| updated_at | TIMESTAMP | Last updated |

### 10. email_providers
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| name | VARCHAR | Provider name (sendgrid, mailgun, smtp) |
| display_name | VARCHAR | Display name |
| api_key | VARCHAR | API Key (encrypted) |
| smtp_host | VARCHAR | SMTP Host |
| smtp_port | INT | SMTP Port |
| smtp_username | VARCHAR | SMTP Username |
| smtp_password | VARCHAR | SMTP Password (encrypted) |
| from_email | VARCHAR | Default from email |
| from_name | VARCHAR | Default from name |
| is_active | BOOLEAN | On/Off status |
| is_test_mode | BOOLEAN | Test/Live mode |
| created_at | TIMESTAMP | Created date |
| updated_at | TIMESTAMP | Last updated |

---

## Panel Features

### 1. Landing Page
- Hero section with "Book a Developer in 10 Minutes"
- How it works (3 steps)
- Featured developers
- Why choose us
- Pricing
- Testimonials
- FAQ
- Login/Register buttons

### 2. Super Admin Panel

#### Dashboard Stats
- Total/Active/Inactive/Blocked Users
- Total/Active/Inactive/Blocked Developers
- Total Bookings, Revenue, Pending Bookings

#### User Management
- View all users
- Edit/Block/Delete users
- Filter and search

#### Developer Management & Approval
- View all developers
- Approve/Reject pending developers
- Re-approve rejected developers
- Filter by approval status

#### Booking Management (ALL Bookings)
- View ALL bookings
- See user name, developer name, full details
- Filter by status, date, payment
- Admin notes
- Cancel, Dispute, Refund actions

#### Support Ticket Management
- View ALL tickets from users & developers
- Reply to tickets
- Internal notes
- Assign, Close, Reopen

#### Integration Configuration
- Payment Gateways (Stripe, Razorpay, PayPal)
- SMS Providers (Twilio, MSG91, TextLocal)
- Email Providers (SendGrid, Mailgun, SMTP)
- Toggle On/Off, Edit API keys

### 3. Developer Panel

#### Dashboard
- Profile completion status
- Active bookings, Earnings, Rating

#### Profile Management
- Edit profile, skills, rate, availability

#### Booking Management (THEIR Bookings Only)
- View own bookings
- Accept/Decline requests
- Submit milestones
- Upload deliverables
- Message clients

#### Earnings
- Earnings overview
- Transaction history
- Withdrawal requests

#### Support Tickets
- Create ticket to Super Admin
- View own tickets
- Reply to admin

### 4. User Panel

#### Dashboard
- Active/Past bookings
- Total spent

#### Profile Management
- Edit profile

#### Browse Developers
- Search and filter developers
- View developer profiles and reviews

#### Booking Management (THEIR Bookings Only)
- View own bookings
- Book a developer
- Approve milestones
- Download deliverables
- Rate developers

#### Support Tickets
- Create ticket to Super Admin
- View own tickets
- Reply to admin

---

## Developer Approval Workflow

```
Developer Registers → Fills Onboarding Form → Status: PENDING
                                                    ↓
Super Admin Reviews → APPROVE (can use panel) OR REJECT (with reason)
                                                    ↓
                                    Rejected developer can be RE-APPROVED later
```

---

## Booking Visibility

| Information | Super Admin | Developer | User |
|-------------|:-----------:|:---------:|:----:|
| Booking ID | ✅ | ✅ | ✅ |
| User Name | ✅ | ✅ | ✅ |
| User Email | ✅ | ❌ | ✅ |
| User Phone | ✅ | ❌ | ✅ |
| Developer Name | ✅ | ✅ | ✅ |
| Developer Email | ✅ | ✅ | ❌ |
| Developer Phone | ✅ | ✅ | ❌ |
| Project Details | ✅ | ✅ | ✅ |
| Budget | ✅ | ✅ | ✅ |
| Platform Fee | ✅ | ✅ | ❌ |
| Developer Earnings | ✅ | ✅ | ❌ |
| Milestones | ✅ | ✅ | ✅ |
| Files | ✅ | ✅ | ✅ |
| History Log | ✅ | ❌ | ❌ |
| Admin Notes | ✅ | ❌ | ❌ |

---

## Support Ticket System

| Role | Can Create Tickets | Can View |
|------|-------------------|----------|
| User | ✅ | Own tickets only |
| Developer | ✅ | Own tickets only |
| Super Admin | N/A | ALL tickets |

### Ticket Categories
- General Inquiry
- Booking Issue
- Payment Issue
- Dispute
- Technical Issue
- Other

### Priority Levels
| Priority | Response Time |
|----------|---------------|
| Low | 24-48 hours |
| Medium | 12-24 hours |
| High | 4-12 hours |
| Urgent | 1-4 hours |

---

## Dynamic Integration System

Super Admin can configure from panel (no code changes):

### Payment Gateways
- Stripe, Razorpay, PayPal, PayStack, Square
- Toggle On/Off
- Test/Live mode
- Edit API keys

### SMS Providers
- Twilio, MSG91, TextLocal, AWS SNS
- Toggle On/Off
- Edit credentials

### Email Providers
- SendGrid, Mailgun, Amazon SES, SMTP
- Toggle On/Off
- Edit settings

---

## Security Features

- Input validation & sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Password encryption (bcrypt)
- JWT token security
- Role-based access control
- Contact info blocking in chat
- Activity logging
- API key encryption (AES-256)

---

## Development Timeline

| Week | Phase |
|------|-------|
| 1 | Project Setup |
| 2 | Landing Page |
| 3 | Authentication System |
| 4 | Developer Onboarding |
| 5 | Super Admin Panel |
| 6 | Booking System Core |
| 7 | Developer Panel |
| 8 | User Panel |
| 9 | Support Ticket System |
| 10 | Integration Configuration |
| 11 | Chat System |
| 12 | Payment Processing |
| 13 | Testing |
| 14 | Deployment |

---

**Status:** Planning Complete - Ready for Development
**Last Updated:** March 8, 2026

**See [TASKS.md](./TASKS.md) for detailed task checklist**
