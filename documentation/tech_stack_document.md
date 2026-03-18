# smartolt-gis-monitor Tech Stack Document

This document explains, in everyday language, the main technology choices for the smartolt-gis-monitor project. It shows how each piece helps us build a user-friendly, reliable GIS dashboard for network operations.

## 1. Frontend Technologies
These are the tools and libraries that power everything you see and interact with in your browser:

- Next.js (App Router)
  - A popular framework that gives us a fast, server-rendered website. It makes pages load quickly and helps with search engines without extra setup.
- TypeScript
  - A way to write JavaScript with extra checks so we catch errors early. It makes the code easier to maintain as the project grows.
- Tailwind CSS (with CSS variables)
  - A utility-first styling framework that lets us build a clean, responsive design quickly. CSS variables let us switch between light and dark modes easily.
- Radix UI & Shadcn/ui
  - Ready-made, accessible components (buttons, dialogs, tables) that look consistent and work well across devices.
- React Hooks (`useState`, `useContext`)
  - Built-in React features to manage page state and share data (like user info) between components.
- Mapping Library (React Leaflet or Mapbox GL JS)
  - Lets us display an interactive map with markers for ONUs, ODPs, and OLTs. Users can pan, zoom, and click for details.
- Data Fetching (SWR or React Query)
  - Helps load and update data in real time by polling our backend every 30–60 seconds, keeping the map and tables fresh without manual refresh.

**How these help the user experience**
- Fast initial load thanks to server rendering
- Clear, consistent UI with ready-built components
- Seamless light/dark mode for 24/7 dashboards
- Interactive map for an intuitive geographic view
- Automatic data updates to reflect network changes in near real time

## 2. Backend Technologies
Here’s what runs behind the scenes to handle data, security, and business logic:

- Next.js API Routes (Backend-for-Frontend)
  - Acts as a secure bridge between the frontend and external services. It hides sensitive API keys and merges data from multiple sources into a single, clean response.
- Better Auth
  - Manages user sign-in, sessions, and role-based access control so only authorized NOC personnel can view or edit data.
- PostgreSQL Database
  - A reliable, open-source database for storing user accounts, app settings, ODP locations, historical logs, and cached API results.
- Drizzle ORM
  - A type-safe layer on top of PostgreSQL that makes it easy to define and run database queries without raw SQL.
- `lib/smartolt-client.ts`
  - A small helper module that wraps all calls to the external SmartOlt API, keeping network logic organized in one place.
- Environment Variables
  - Securely store API keys and other secrets on the server, so they never get exposed in the user’s browser.

**How these work together**
1. Frontend calls our internal API routes (e.g., `/api/smartolt/onus`).  
2. API routes use `smartolt-client` to fetch data from the SmartOlt API.  
3. Data is optionally stored or cached in PostgreSQL via Drizzle.  
4. API routes combine and return the data to the frontend in a single payload.

## 3. Infrastructure and Deployment
Tools and processes that ensure the application runs smoothly, scales with demand, and is easy to update:

- Docker & Docker Compose
  - Containerize the Next.js app and PostgreSQL database so they run consistently in any environment.
- GitHub Actions (CI/CD)
  - Automatically run tests, build Docker images, and deploy to production whenever code is pushed to the main branch.
- Version Control (Git & GitHub)
  - Keep track of code changes, collaborate with other developers, and maintain a clean history of updates.
- Hosting Platform (e.g., Vercel, AWS, or any Docker-friendly server)
  - Runs the containers in the cloud, ensuring high availability and easy scaling as more operators use the dashboard.

**Benefits for reliability and scalability**
- Consistent environments from development to production
- Automated checks and deployments reduce human error
- Easy rollbacks if something goes wrong
- Scalability through container orchestration or cloud auto-scaling

## 4. Third-Party Integrations
Services and APIs that extend functionality without reinventing the wheel:

- SmartOlt API
  - Provides real-time data on ONUs, ODPs, and OLTs (coordinates, status, signal graphs).
- Mapping Library (React Leaflet or Mapbox GL JS)
  - Displays geographical data over a map with interactive features.

**Why these matter**
- SmartOlt API is the core data source for network status.
- Mapping libraries make geographic visualization easy, interactive, and informative.

## 5. Security and Performance Considerations
Key measures to protect data and keep the experience smooth:

Security:
- Authentication & Authorization (Better Auth)
  - Ensures only the right people can access specific parts of the dashboard.
- Environment Variables & BFF Pattern
  - Keeps API keys and secrets safely on the server, never in the browser.
- Role-Based Access Control
  - Different permission levels for operators, engineers, and administrators.

Performance:
- Server-Side Rendering (Next.js)
  - Delivers a fully rendered page on the first load for faster perceived performance.
- Caching & Polling (SWR or React Query)
  - Reduces unnecessary API calls by caching responses and only refetching on a set interval.
- Database Indexing & Drizzle ORM
  - Efficient data retrieval for large tables like historical logs or ODP coordinates.
- Tailwind CSS Utility Classes
  - Produces small, focused stylesheets that load quickly and avoid unused CSS.

## 6. Conclusion and Overall Tech Stack Summary
Below is a quick recap of our technology choices and why they align with the project goals:

- **Next.js + TypeScript**: Fast, maintainable, and SEO-friendly frontend.  
- **Tailwind CSS + Radix UI/Shadcn/ui**: Flexible, accessible, and theme-friendly design.  
- **React Leaflet/Mapbox GL JS**: Intuitive GIS display at the heart of the dashboard.  
- **Next.js API Routes + Better Auth**: Secure, centralized backend logic and user management.  
- **PostgreSQL + Drizzle ORM**: Robust, type-safe data storage for all app data.  
- **Docker + GitHub Actions**: Reliable deployment workflow and scalable infrastructure.  
- **SmartOlt API Integration**: Single source of truth for network component data.

These technologies come together to deliver a production-ready, interactive GIS monitoring dashboard that is secure, scalable, and easy to maintain. By choosing well-supported tools and following established patterns, we ensure a reliable user experience for NOC personnel around the clock.