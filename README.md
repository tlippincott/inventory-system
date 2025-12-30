# Invoice System

A modern, full-stack invoice management system for freelancers built with Node.js, React, and PostgreSQL.

## 🚀 Current Status

**Phase 3 Complete** - Backend APIs are ready for time tracking and invoicing.

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
- ⏳ **Next:** Invoice Management API

See `SESSION_NOTES.md` for detailed progress and next steps.

## Features

- Create and manage invoices with line items and automatic calculations
- Client management with billing addresses
- Manual payment tracking
- Professional PDF invoice generation
- Dashboard with revenue statistics
- Overdue invoice tracking

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
- Tailwind CSS (styling)

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

Key endpoints:

- `GET /health` - Health check
- `GET /api/v1/clients` - List clients
- `GET /api/v1/projects` - List projects
- `GET /api/v1/time-sessions` - List time sessions
- `POST /api/v1/time-sessions/start` - Start a new timer
- `PATCH /api/v1/time-sessions/:id/stop` - Stop a timer
- `GET /api/v1/time-sessions/active` - Get currently running session
- `GET /api/v1/time-sessions/unbilled` - Get unbilled sessions
- `GET /api/v1/invoices` - List invoices
- `GET /api/v1/payments` - List payments
- `GET /api/v1/dashboard/stats` - Dashboard statistics

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `PORT` - Backend server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `VITE_API_URL` - API URL for frontend (default: http://localhost:3001/api/v1)

## Development Workflow

1. **Phase 1: Project Setup** ✓
   - Monorepo structure
   - TypeScript configurations
   - Docker Compose for PostgreSQL
   - Basic Fastify backend
   - Vite + React frontend
   - Shared types package

2. **Phase 2: Database & Core Models** (Next)
   - Database migrations
   - Knex.js models
   - Shared types and Zod schemas

3. **Phase 3: Client Management**
   - Client CRUD API
   - Client list and forms

4. **Phase 4: Invoice Management**
   - Invoice CRUD API
   - Invoice creation with line items
   - Dynamic calculations

5. **Phase 5: PDF Generation**
   - PDFKit service
   - Professional invoice template

6. **Phase 6: Payment Tracking**
   - Payment API
   - Payment recording UI

7. **Phase 7: Dashboard & Analytics**
   - Statistics API
   - Dashboard UI

8. **Phase 8: Settings & Polish**
   - User settings
   - UI/UX improvements

9. **Phase 9: Testing & Documentation**
   - Unit and integration tests
   - API documentation

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT
