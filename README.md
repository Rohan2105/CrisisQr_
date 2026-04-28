# CrisisQR 2.0: Enterprise Disaster Response Platform

CrisisQR 2.0 is a high-performance, GIS-driven emergency management platform built for real-time synchronization between citizens, rescue teams, and government agencies. It utilizes a brutalist, light-mode design system optimized for clarity and speed in high-stress environments.

## 🚀 Core Features

### 1. Unified GIS Command Center
- **Pan-India Map Integration**: Real-time visualization of SOS signals, relief camps, and rescue units.
- **Tactical Symbology**: Standardized markers (Black Pyramids for shelters, Blue Squares for teams, Red Circles for distress).
- **Road-Network Routing**: Automated road-optimal routing via MapTiler Routing API.

### 2. Intelligent SOS Workflow
- **Nearest Shelter Calculation**: Backend Haversine engine identifies the closest relief camp instantly upon signal transmission.
- **Voice-Based Intelligence**: Support for AI-transcribed voice SOS signals to capture critical details in hands-free scenarios.
- **Priority Queueing**: Virtualized list handling 10,000+ signals at 60fps with real-time priority scoring.

### 3. High-Performance Architecture
- **Next.js Dynamic Imports**: Lazy loading of heavy 3D globes and WebGL maps to ensure 0ms route transitions.
- **Suspense Streaming**: Progressive hydration of metrics and data tables.
- **Prisma 7 + SQLite**: Local-first development strategy with mandatory driver adapters for extreme stability.

## 🛠 Tech Stack

- **Framework**: Next.js 16.2.4 (App Router, Turbopack)
- **GIS**: MapTiler SDK & Routing API
- **Visuals**: React Three Fiber (Premium 3D Globe)
- **Database**: Prisma 7 with SQLite (Local dev)
- **Styling**: Tailwind CSS (Strict Brutalist Theme)
- **Performance**: @tanstack/react-virtual

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd resQnet
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env` file in the root:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXT_PUBLIC_MAPTILER_KEY="your_key_here"
   ```

4. **Initialize Database**:
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 🏗 System Architecture

### Database Schema
- **Shelters**: Capacity-tracked relief hubs with geographic coordinates.
- **SOSRequests**: Citizen-originated distress signals with AI-refined priority scores.
- **RescueTeams**: Unit-tracked response teams synchronized across dashboards.
- **Family**: Occupancy tracking for efficient resource allocation.

### Performance Optimization Mandate
The UI thread is protected via:
- **Component Splitting**: Heavy Map components are isolated with `next/dynamic` (ssr: false).
- **Virtualization**: Large data tables in the Rescue Dashboard use list virtualization to prevent DOM bloating.
- **Polling Strategy**: Standardized 5-second polling interval for global state synchronization.

---

## 🎨 Design System Constraints
- **Theme**: Strict Light Mode.
- **Prohibited**: Gradients, neon effects, glows, drop-shadows.
- **Components**: Solid 1px borders, sharp/slightly rounded corners, brutalist contrast.

## 📜 License
Proprietary - CrisisQR Enterprise Solutions.
