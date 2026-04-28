# CrisisQR 2.0 Technical Documentation

## 1. GIS Implementation & Routing Logic

### Coordinate System
The platform operates on the WGS84 coordinate system. Coordinates are stored as `Float` values (lat/lng) in the database.

### Nearest Neighbor Search
We utilize the **Haversine Formula** for spherical distance calculation. This is implemented in `app/actions/sos.ts` to ensure that even in areas with sparse shelter coverage, the citizen is routed to the mathematically closest relief point.

```typescript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  // ... Haversine math
}
```

### Road Network Integration
While Haversine provides the destination, the **MapTiler Routing API** is used to generate the actual navigable path. This prevents the "As-the-crow-flies" error and provides realistic travel time estimates.

## 2. Database Architecture (Prisma 7)

### SQLite Transition
Due to connectivity constraints with remote PostgreSQL servers during development, CrisisQR 2.0 has been migrated to a **Local-First SQLite** architecture.

**Key Configuration Changes:**
- **Driver Adapters**: Mandatory use of `@prisma/adapter-better-sqlite3`.
- **Client Output**: Custom output directory `./prisma/generated-client` to bypass Node.js module caching issues in Turbopack.
- **Config Manifest**: Connection string management moved to `prisma.config.ts`.

### Seeding Strategy
The `prisma/seed.ts` script uses `@faker-js/faker` combined with a fixed array of major Indian cities (Delhi, Mumbai, Ahmedabad, etc.) to generate realistic GIS clusters. This allows developers to test clustering and routing logic immediately upon environment setup.

## 3. Frontend Optimization Strategy

### Thread Management
To maintain a consistent 60fps, we implement a strict "Heavy-Component Isolation" policy:
- **WebGL Components**: Wrapped in `next/dynamic` with `ssr: false`.
- **Virtualization**: The Priority Queue uses `@tanstack/react-virtual` to ensure only visible rows are rendered in the DOM.

### State Synchronization
We utilize a **Controlled Polling Strategy** via the `useMapData` hook. This provides a balance between real-time updates and reduced server load, with a standard 5,000ms - 10,000ms refresh interval.

## 4. Design Guidelines (Brutalist)

The project adheres to a "Tactical UI" philosophy:
- **Borders**: Always `1px solid border-border`.
- **Contrast**: High contrast between foreground and background.
- **Markers**:
  - `SHELTER`: Black Upward Triangle (Pyramid).
  - `TEAM`: Blue Square.
  - `SOS`: Circle with severity-based color coding.

## 5. Security & Authorization

Currently, the system uses Role-Based Access Control (RBAC) defined in the Prisma Schema (`CITIZEN`, `RESCUE`, `ADMIN`).
- **Server Actions**: All CRUD operations (Rescue dispatch, Shelter updates) are isolated in Server Actions within `app/actions/`.
- **Path Protection**: Next.js Middleware (proposed) should be used to gate `/rescue/*` and `/admin/*` routes.
