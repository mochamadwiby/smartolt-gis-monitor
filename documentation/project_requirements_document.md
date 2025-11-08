# Project Requirements Document (PRD)

## 1. Project Overview

We are building **SmartOLT GIS Monitor**, a real-time, full-stack web application that gives Network Operations Center (NOC) staff an interactive geographic view of critical network components—namely Optical Line Terminals (OLTs), Optical Distribution Points (ODPs), and Optical Network Units (ONUs). By consuming data from the SmartOlt API and displaying it on a dynamic map, operators can instantly see each device’s status (online, offline, or loss-of-signal), trace cable connections, and access detailed metrics—all on a high-resolution 4K screen.

This application is designed to solve the problem of distributed and siloed network information. Instead of logging into multiple tools or reading text logs, NOC personnel get a unified, visual dashboard that updates every 30–60 seconds. Key success criteria include: fast initial load on large displays, clear status color-coding on the map, secure user access, and reliable real-time updates without hitting API rate limits.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (Version 1.0)
- User authentication and session management (Better Auth integration)
- Backend-for-Frontend (BFF) API proxy routes to SmartOlt endpoints
- Interactive GIS map component (React Leaflet or Mapbox GL JS)
- Real-time polling (every 30–60s) with caching (SWR or React Query)
- PostgreSQL database schema for users, ODP locations, and cached API data (Drizzle ORM)
- Core UI components: map markers, polylines, detail dialogs, data table
- Light/dark theme switcher and responsive design for 4K displays
- Docker and Docker Compose setup for local development and production
- Basic unit, integration, and end-to-end tests

### Out-of-Scope (Planned for Later Phases)
- SMS/email alert notifications or incident management
- Predictive analytics or machine learning for outage forecasting
- Granular role-based permissions beyond admin/operator
- Offline mode or edge-cached deployment
- Mobile-optimized or native mobile app
- Geofencing or heatmap overlays

## 3. User Flow

When a NOC operator arrives at the dashboard, they first land on a login page. They enter their credentials, which the app verifies via Better Auth. Upon success, they are redirected to the main **Dashboard** screen, which spans the full browser window. A collapsible sidebar on the left offers navigation links (Dashboard, Settings, Logs), while the right-hand area shows the GIS map centered on the service region.

Once the map loads, it fetches device data through internal API routes. Each ONU, ODP, and OLT appears as a colored marker—green for online, red for offline, yellow for LOS (loss of signal). The operator can pan and zoom to focus on problem areas. Clicking any marker opens a slide-over or dialog panel with detailed stats (last heartbeat, signal strength graph, location details). The map also draws polylines from each ONU to its parent ODP for quick visual correlation.

## 4. Core Features

- **Authentication & Authorization**: Secure sign-in, session cookies, and protected routes.
- **BFF API Proxy**: Next.js API routes that merge SmartOlt data and hide API keys.
- **Interactive GIS Map**: Render markers and polylines, pan/zoom controls, clickable pop-ups.
- **Real-Time Polling & Caching**: Automatic background refresh with configurable interval and local caching to throttle API calls.
- **Data Persistence**: PostgreSQL tables for users, ODP coordinates, and cached API responses via Drizzle ORM.
- **UI Components & Theming**: Reusable Radix UI / Shadcn/ui dialogs, tables, charts, plus Tailwind CSS themes.
- **Dockerized Deployment**: Dockerfile and docker-compose.yml for app and database containers.
- **Testing Suite**: Unit tests (Vitest or Jest), integration tests (React Testing Library), E2E tests (Playwright or Cypress).

## 5. Tech Stack & Tools

- Frontend: Next.js (v13+) with App Router, React, TypeScript
- Styling: Tailwind CSS with CSS variables, Radix UI, Shadcn/ui
- GIS Library: React Leaflet (open-source) or Mapbox GL JS
- State & Data Fetching: React Query or SWR
- Backend: Next.js API Routes (Node.js), TypeScript
- Authentication: Better Auth (JWT or session cookies)
- Database: PostgreSQL, Drizzle ORM (Type-safe SQL)
- Containerization: Docker, Docker Compose
- CI/CD: GitHub Actions (testing & deployment workflows)
- Testing: Vitest/Jest, React Testing Library, Playwright/Cypress

## 6. Non-Functional Requirements

- Performance: Initial load ≤ 2 seconds; map interaction latency < 100 ms.
- Scalability: Handle thousands of map markers without degrading user experience (marker clustering if needed).
- Security: HTTPS everywhere, OWASP best practices, secure storage of environment variables.
- Availability: 99.9% uptime target; graceful handling of SmartOlt API downtime.
- Usability: High-contrast UI for on-call readability; keyboard navigation for dialogs; responsive 4K layout.
- Compliance: GDPR-compatible data handling; logs do not store sensitive user data.

## 7. Constraints & Assumptions

- **SmartOlt API Rate Limits**: Assume a soft limit of X requests/minute; must implement caching and polling intervals accordingly.
- **Static ODP Locations**: ODP coordinates do not change frequently; can be loaded once and stored in DB.
- **Env Requirements**: Node.js v18+, PostgreSQL v13+, modern browser support (Chromium-based NOC displays).
- **Screen Size**: Primary display is a 50-inch, 4K resolution monitor.

## 8. Known Issues & Potential Pitfalls

- **API Rate Limits**: Excessive polling can hit SmartOlt limits. Mitigation: cache results server-side and batch endpoint calls.
- **Map Performance**: Rendering thousands of markers can lag. Mitigation: use clustering plugins or canvas-based marker layers.
- **CORS & Environment**: Improper header config on API proxy may block requests. Mitigation: test headers in development and production modes.
- **Data Consistency**: SmartOlt API endpoint changes can break the BFF routes. Mitigation: write modular client code in `lib/smartolt-client.ts` and add unit tests around data parsing.
- **Schema Migrations**: Extending Drizzle ORM schema requires coordination with existing data. Mitigation: use versioned migration scripts and backup DB before applying changes.

---

This PRD should guide all subsequent technical documentation and implementation steps. It leaves no ambiguity around scope, workflows, technologies, and risks.