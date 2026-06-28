# Order Management System (OMS)

[![Full Stack](https://img.shields.io/badge/Full%20Stack-Developer%20Assessment-2f6f4f)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)]()
[![Docker](https://img.shields.io/badge/Docker-Supported-2496ed)]()

 multi-store Restaurant Order Management System built as part of a Full Stack Developer Assessment.  
The application combines a clean REST API, PostgreSQL, Socket.IO, analytics, archival, invoice management, and a modern Next.js UI.

---

## 1) Objective

The goal of the assessment was to build a multi-store order management platform with:

- Multi-Store Order Management
- REST APIs
- PostgreSQL Database
- Real-Time Updates using Socket.IO
- Data Analytics
- Order Archival
- Pagination
- Validation
- Clean Architecture

This repository completes the primary objectives of the assessment and extends the scope with several practical production-oriented enhancements.

---

## 2) Features

### Assignment Features

- Multi-store support
- Create orders
- Update order status
- Fetch orders by store
- Order detail view
- Pagination for order lists
- PostgreSQL persistence
- Database indexing
- Socket.IO real-time updates
- Live order refresh
- Order analytics
- Revenue analytics
- Top selling items analytics
- Order archival
- React Query for server state
- Responsive UI
- Request validation with Zod
- Clean layered backend architecture
- Docker / Docker Compose support

### Additional Features

The following enhancements are implemented beyond the original assessment requirements:

- Invoice Management
- Store-specific invoice configuration
- Printable invoice preview
- PDF-friendly browser print flow
- Download invoice as PDF via browser print dialog
- QR code payment section
- Automatic GST calculation
- Customer name optional
- Walk-in customer support
- Food Management module
- Food category tagging and filtering
- Food image upload
- Default food image fallback
- Custom sequential tracking number
- Tracking number used as invoice number
- Dark mode
- Light mode
- Responsive POS-style layout
- Live order summary
- Improved UI / UX
- Store-based invoice settings
- Order type support can be added cleanly for Dine-In / Take Away workflows

### Notes on Enhancement Scope

- “Printable invoice preview” is implemented as a dedicated invoice route with a browser print flow, which also allows saving as PDF from the print dialog.
- “Category management” is implemented as category tagging/filtering on foods rather than a separate category table.
- The codebase is structured so order-type extensions like Dine-In / Take Away can be added cleanly later.

---

## 3) Tech Stack

| Area | Stack |
|---|---|
| Frontend | Next.js 14+, React, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Real-Time | Socket.IO |
| State Management | Zustand, React Query |
| Styling | Tailwind CSS |
| Containerization | Docker, Docker Compose |
| Development Tools | Zod, Axios, pg, multer, tsx |

---

## 4) Quick Installation (Recommended)

Docker is the recommended installation method.

### Start the full stack

```bash
docker compose up --build
```

Docker starts:

- PostgreSQL
- Backend API + Socket.IO
- Frontend application

### Apply migrations

```bash
docker compose exec backend npm run migrate
```

### Open the app

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

---

## 5) Manual Installation

### A) Database

```bash
createdb oms_db
psql oms_db -f backend/src/db/schema.sql
```

### B) Backend

```bash
cd backend
npm install
npm run migrate
npm run dev
```

Backend runs on `http://localhost:4000`.

### C) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

---

## 6) Environment Variables

### Backend

Create `backend/.env`:

```env
PORT=4000
DATABASE_URL=postgresql://oms_user:oms_password@localhost:5432/oms_db
CORS_ORIGIN=http://localhost:3000
ARCHIVE_AFTER_DAYS=30
```

### Frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Example `.env.example`

```env
# backend/.env.example
PORT=4000
DATABASE_URL=postgresql://oms_user:oms_password@localhost:5432/oms_db
CORS_ORIGIN=http://localhost:3000
ARCHIVE_AFTER_DAYS=30

# frontend/.env.local.example
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 7) Project Structure

```text
OMS/
├── backend/
│   ├── src/
│   │   ├── controllers/   # HTTP handlers
│   │   ├── services/      # Business logic + SQL
│   │   ├── routes/        # Express route definitions
│   │   ├── validators/    # Zod schemas
│   │   ├── middlewares/   # Validation, upload, error handling
│   │   ├── sockets/       # Socket.IO server
│   │   └── db/            # Schema + migration script
│   └── public/            # Uploaded assets
├── frontend/
│   ├── src/app/           # Next.js routes and pages
│   ├── src/components/    # UI components
│   ├── src/lib/            # API client, socket helpers
│   ├── src/store/          # Zustand state
│   └── public/             # Static assets
└── docker-compose.yml
```

### Major folders

- `backend/src/controllers` — request handlers
- `backend/src/services` — database and business rules
- `backend/src/routes` — API endpoints
- `frontend/src/app` — pages and route segments
- `frontend/src/components` — reusable UI pieces
- `frontend/src/lib` — data fetching and realtime helpers

---

## 8) Architecture

```text
Client
  ↓
Next.js Frontend
  ↓
REST API + Socket.IO
  ↓
Express Backend
  ↓
Service Layer
  ↓
PostgreSQL Database
```

### Data flow

- React Query handles server state, caching, and invalidation on the frontend.
- Socket.IO pushes new order and status update events in real time.
- Express routes delegate to services, keeping controllers thin.
- Services own SQL queries and database transactions.
- PostgreSQL stores orders, archived orders, foods, invoice configs, and tracking sequences.

---

## 9) Database Design

### Core tables

| Table | Purpose |
|---|---|
| `orders` | Active orders for each store |
| `orders_archive` | Archived historical orders |
| `foods` | Food catalog for order creation |
| `invoice_configs` | One invoice configuration per store |
| `order_tracking_sequences` | Daily per-store tracking sequence counter |

### Relationships

- `orders.items` stores line items as JSONB and references `foods.id`
- `orders_archive` mirrors `orders` for easy archival moves
- `invoice_configs` is keyed by `store_id` so each store has one configuration
- `order_tracking_sequences` ensures tracking numbers remain sequential per store per day

### Indexes

- `orders(store_id)`
- `orders(created_at)`
- `orders(store_id, created_at DESC)`
- `orders(items)` GIN index for analytics
- `orders_archive(store_id)`
- `orders_archive(created_at)`
- `foods(category)`

### Archival

- Old orders are moved from `orders` to `orders_archive`
- Analytics reads both tables so totals stay consistent after archiving

---

## 10) API Documentation

### Orders

| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders` | Create an order |
| GET | `/orders?store_id=&page=&limit=&status=` | List orders for a store |
| GET | `/orders/:id` | Get order by tracking number |
| PATCH | `/orders/:id/status` | Update order status |

### Food

| Method | Endpoint | Description |
|---|---|---|
| GET | `/foods` | List food items |
| GET | `/foods/:id` | Get food item by ID |
| POST | `/foods` | Create food item |
| PATCH | `/foods/:id` | Update food item |
| DELETE | `/foods/:id` | Delete food item |

### Categories

- Categories are managed through the `category` field on `foods`
- `GET /foods?category=` filters foods by category
- There is no separate category table or CRUD API in the current build

### Invoice Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/invoice-configs/:storeId` | Get store invoice config |
| PUT | `/invoice-configs/:storeId` | Create or update invoice config |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics/orders-per-day?store_id=&days=` | Orders per day |
| GET | `/analytics/revenue-per-store` | Revenue per store |
| GET | `/analytics/top-items?store_id=&limit=` | Top selling items |

### Archive

| Method | Endpoint | Description |
|---|---|---|
| POST | `/archive-old-orders` | Archive orders older than configured cutoff |

### Socket events

| Direction | Event | Payload |
|---|---|---|
| client → server | `join_store` | `store_id` |
| client → server | `leave_store` | `store_id` |
| server → client | `order:new` | order object |
| server → client | `order:status_updated` | order object |

---

## 11) Real-Time Features

- New orders are broadcast over Socket.IO immediately
- Order status updates are broadcast in real time
- Orders page refreshes automatically through React Query invalidation
- UI remains synchronized across clients without manual refresh
- Store-based events ensure each store only receives its own updates
- Reconnect support is enabled for temporary network drops

---

## 12) Invoice System

The Invoice module is store-specific and configurable.

### What it includes

- Restaurant name
- Restaurant address
- GST number
- QR code upload
- Default QR fallback from `frontend/public/QR.png`
- Footer note
- Tracking number as invoice number

### Printing

- Dedicated invoice route
- Browser print flow for A4 output
- Clean invoice preview before printing

### Numbering

- The tracking number is the invoice number
- No separate invoice ID is generated
- Format: `#S<StoreNumber>-DDMMYYYY00001`
- Sequence restarts daily per store

---

## 13) Screenshots



- New Order

- Orders


- Food Management

- Invoice Management

- Analytics

- Invoice Preview

- Dark Mode
- Light Mode

Suggested paths:


---

## 14) Performance Considerations

- Pagination avoids loading the full order set at once
- SQL queries are optimized with indexes
- Analytics uses aggregation queries instead of per-row loops
- React Query caches and deduplicates server requests
- Socket.IO events are store-scoped to reduce unnecessary updates
- Backend follows a modular architecture for maintainability
- UI reuses shared components for consistency and smaller surface area

---

## 15) Future Improvements

- Authentication
- Role-based access control
- Inventory management
- Online payments
- Cloud storage for images
- Email receipts
- Mobile application
- Multi-language support
- Dedicated PDF export endpoint
- Order type selection such as Dine-In / Take Away

---


## 16)Final Conclusion

This project successfully satisfies the Full Stack Developer Assessment requirements and extends them with production-oriented improvements such as invoice management, sequential tracking numbers, food management, real-time updates, and a polished responsive UI.

The codebase is organized with clean architecture, scalable database design, reusable frontend components, and clear separation of responsibilities, making it maintainable and production-ready.

