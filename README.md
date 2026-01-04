# Invoice System

A modern, full-stack invoice management system with time tracking for freelancers, built with Node.js, React, and PostgreSQL.

## 🚀 Current Status

**Phase 8 Complete** - Full-stack application with time tracking, client/project management, and invoice generation.

### Completed Features

**Backend APIs:**
- ✅ Monorepo structure with workspaces
- ✅ TypeScript configured for all packages
- ✅ Backend: Fastify server with health checks
- ✅ Frontend: React + Vite + Tailwind CSS
- ✅ Shared types and validation schemas
- ✅ Docker Compose for PostgreSQL
- ✅ Database migrations (7 tables) with seed data
- ✅ **Projects API** - 11 endpoints with smart delete & unbilled time tracking
- ✅ **Client Management API** - 7 endpoints with email validation & statistics
- ✅ **Time Sessions API** - 14 endpoints with timer controls, quarter-hour rounding & billing management
- ✅ **Invoice Management API** - 11 endpoints with time-to-invoice conversion & automatic calculations
- ✅ **Payment API** - 6 endpoints with auto-status updates & overpayment prevention
- ✅ **User Settings API** - 2 endpoints with business configuration & protected invoice numbering
- ✅ **PDF Generation** - 2 endpoints with professional invoice PDFs using PDFKit
- ✅ **Dashboard Stats API** - 1 endpoint with comprehensive business metrics

**Frontend UI:**
- ✅ Dashboard page with revenue metrics and quick actions
- ✅ Time Tracking page with real-time timer and session management
- ✅ Projects page with three-state filtering (active/all/archived)
- ✅ Clients page with search and CRUD operations
- ✅ Navigation and routing
- ✅ Form validation with React Hook Form + Zod
- ✅ TanStack Query for server state management
- ✅ Toast notifications for user feedback
- ✅ Real-time timer updates with polling

**Recent Bug Fixes (Jan 2, 2026):**
- ✅ Fixed Projects page filter buttons (three-state view system)
- ✅ Fixed query parameter boolean serialization
- ✅ Simplified client deletion logic (prevent deletion if has invoices)
- ✅ Improved time tracking optimistic updates
- ✅ Fixed elapsed time calculations to prevent negative values

**Total API Endpoints:** 54 (all tested and working)

See `SESSION_NOTES.md` for detailed progress and implementation notes.

## Features

### Time Tracking
- Start/stop/pause/resume timers
- Real-time elapsed time display
- Automatic quarter-hour rounding
- Billable time tracking per project
- View recent and unbilled sessions

### Client & Project Management
- Full CRUD operations for clients and projects
- Smart filtering (active/inactive/archived)
- Search functionality
- Client statistics and invoice tracking
- Project hourly rates and time tracking

### Invoice Management
- Create invoices from time sessions
- Manual invoice creation with line items
- Automatic calculations (subtotal, tax, total)
- Invoice status workflow (draft → sent → paid)
- PDF generation with professional templates
- Payment tracking

### Dashboard
- Revenue metrics (total, outstanding, overdue)
- Unbilled time tracking
- Project and client counts
- Quick actions for common tasks
- Alert notifications

## Tech Stack

**Backend:**
- Node.js + TypeScript
- Fastify (web framework)
- PostgreSQL (database)
- Knex.js (migrations & query builder)
- PDFKit (PDF generation)
- Zod (validation)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- React Router v6
- TanStack Query (server state)
- React Hook Form + Zod (forms)
- Tailwind CSS + shadcn/ui (styling)

## Project Structure

```
invoice-system/
├── packages/
│   ├── server/         # Backend API
│   ├── client/         # React frontend
│   └── shared/         # Shared types & validators
├── docker-compose.yml
├── package.json
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- Docker and Docker Compose (for database)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd invoice-system
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file:
```bash
cp .env.example .env
```

4. Start the PostgreSQL database:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. (Optional) Seed the database with sample data:
```bash
npm run db:seed
```

### Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
# Backend only (http://localhost:3001)
npm run dev:server

# Frontend only (http://localhost:5173)
npm run dev:client
```

### Available Scripts

- `npm run dev` - Start both frontend and backend
- `npm run build` - Build all packages
- `npm run db:migrate` - Run database migrations
- `npm run db:rollback` - Rollback last migration
- `npm run db:seed` - Seed database with sample data
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Database Management

### Access pgAdmin

pgAdmin is available at http://localhost:5050

- Email: admin@invoice-system.local
- Password: admin

### Database Connection

The PostgreSQL database runs on `localhost:5432`:

- Database: invoice_system
- User: invoice_user
- Password: invoice_password

## API Documentation

The API is available at http://localhost:3001

### Key Endpoints

**Health & Status:**
- `GET /health` - Health check

**Clients:**
- `GET /api/v1/clients` - List clients (with search & filters)
- `POST /api/v1/clients` - Create client
- `GET /api/v1/clients/:id` - Get client
- `PUT /api/v1/clients/:id` - Update client
- `DELETE /api/v1/clients/:id` - Delete client (prevented if has invoices)
- `PATCH /api/v1/clients/:id/toggle-active` - Toggle active status
- `GET /api/v1/clients/:id/statistics` - Get client statistics

**Projects:**
- `GET /api/v1/projects` - List projects (with filters: active, archived, search)
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project
- `PATCH /api/v1/projects/:id/toggle-active` - Toggle active status
- `PATCH /api/v1/projects/:id/archive` - Archive project
- `PATCH /api/v1/projects/:id/unarchive` - Unarchive project
- `GET /api/v1/projects/active/unbilled` - Get projects with unbilled time
- `GET /api/v1/projects/:id/unbilled-stats` - Get unbilled time statistics

**Time Sessions:**
- `POST /api/v1/time-sessions/start` - Start a new timer
- `PATCH /api/v1/time-sessions/:id/stop` - Stop a timer (with quarter-hour rounding)
- `PATCH /api/v1/time-sessions/:id/pause` - Pause a timer
- `PATCH /api/v1/time-sessions/:id/resume` - Resume a paused timer
- `GET /api/v1/time-sessions/active` - Get currently running session
- `GET /api/v1/time-sessions/unbilled` - Get unbilled sessions
- `GET /api/v1/time-sessions/billing-summary` - Get billing aggregates
- `GET /api/v1/time-sessions` - List sessions with filtering
- `PATCH /api/v1/time-sessions/bulk-update` - Update multiple sessions

**Invoices:**
- `GET /api/v1/invoices` - List invoices with filtering (client, status, dates)
- `POST /api/v1/invoices` - Create invoice manually
- `POST /api/v1/invoices/from-sessions` - Create invoice from time sessions
- `GET /api/v1/invoices/:id` - Get invoice with items
- `PUT /api/v1/invoices/:id` - Update invoice
- `DELETE /api/v1/invoices/:id` - Delete invoice
- `PATCH /api/v1/invoices/:id/status` - Update invoice status
- `POST /api/v1/invoices/:id/generate-pdf` - Generate invoice PDF
- `GET /api/v1/invoices/:id/pdf` - Download invoice PDF

**Payments:**
- `GET /api/v1/payments` - List payments with filtering
- `POST /api/v1/payments` - Create payment (auto-updates invoice status)
- `GET /api/v1/payments/:id` - Get payment details
- `GET /api/v1/invoices/:id/payments` - Get all payments for invoice

**Settings:**
- `GET /api/v1/user-settings` - Get business settings
- `PUT /api/v1/user-settings` - Update business settings

**Dashboard:**
- `GET /api/v1/dashboard/stats` - Get dashboard statistics

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `PORT` - Backend server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `VITE_API_URL` - API URL for frontend (default: http://localhost:3001/api/v1)

## Frontend Pages

1. **Dashboard** (`/`) - Revenue metrics, unbilled time, quick actions
2. **Time Tracking** (`/time-tracking`) - Timer controls, recent sessions
3. **Projects** (`/projects`) - Project management with three-state filtering
4. **Clients** (`/clients`) - Client management with search

## Development Workflow

1. **Phase 1: Project Setup** ✅ COMPLETE
2. **Phase 2: Database & Core Models** ✅ COMPLETE
3. **Phase 3: Client Management** ✅ COMPLETE
4. **Phase 4: Invoice Management** ✅ COMPLETE
5. **Phase 5: PDF Generation** ✅ COMPLETE
6. **Phase 6: Payment Tracking** ✅ COMPLETE
7. **Phase 7: Dashboard & Analytics** ✅ COMPLETE
8. **Phase 8: Frontend UI** ✅ COMPLETE
9. **Phase 9: Testing & Documentation** ⏳ IN PROGRESS

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT
