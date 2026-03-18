# smartolt-gis-monitor Frontend Guideline Document

This document outlines the frontend architecture, design principles, and technologies used in the smartolt-gis-monitor project. It’s written in clear, everyday language so that anyone—technical or not—can understand how the frontend is set up and why certain choices were made.

## 1. Frontend Architecture

**Framework & Libraries**
- **Next.js (App Router)**: Provides file-based routing, server-side rendering (SSR), and API routes. It’s the backbone of our frontend and gives us great performance out of the box.
- **TypeScript**: Adds type checking to JavaScript, catching errors early and making the code easier to maintain.
- **Radix UI & Shadcn/ui**: A collection of accessible, production-ready components (dialogs, tables, buttons) that we can customize to build our map pop-ups, sidebars, and info panels.

**How It Supports Our Goals**
- **Scalability**: File-based routing and modular components let us grow the app without the codebase turning into a tangled mess.
- **Maintainability**: TypeScript and clear folder structures mean new developers (or you, in six months) can quickly understand what’s going on.
- **Performance**: Server-side rendering (SSR) gives fast initial loads. Next.js also does automatic code splitting so users only download what they need.
- **Security (BFF Pattern)**: Next.js API routes act as a Backend-for-Frontend (BFF). This hides our SmartOlt API keys on the server and lets us reshape data before it reaches the browser.

## 2. Design Principles

We follow a few simple rules to keep the interface user-friendly:

- **Usability**: Controls are intuitive. Buttons, dialogs, and tables look and behave consistently.
- **Accessibility**: We use Radix UI’s accessible components, adhere to contrast guidelines, and include keyboard navigation everywhere.
- **Responsiveness**: The layout adapts to any screen size—from a desktop browser to a 50-inch 4K NOC display.
- **Clarity**: We favor clear iconography, readable text sizes, and straightforward color coding (e.g., green for healthy ONUs, red for offline).

**Applying These Principles**
- All interactive elements have focus states and alt text for screen readers.
- Layouts use flexible CSS (Tailwind’s utility classes) so panels, maps, and tables rearrange smoothly.
- We test with real users or stakeholders on 4K monitors to confirm the interface remains clear at a distance.

## 3. Styling and Theming

**Styling Approach**
- **Tailwind CSS**: A utility-first framework. We use preconfigured utility classes plus custom CSS variables for easy theming.
- **No heavy CSS files**—styles live alongside components, keeping things organized and preventing style clashes.

**CSS Methodology**
- **Utility-First**: Instead of BEM or SMACSS, we rely on Tailwind’s small, composable classes.
- **Custom Variables**: Define colors and spacing in `:root` so we can switch themes quickly.

**Theming**
- Two modes: **Light** and **Dark**. Users can toggle these in settings. We store the choice in `localStorage` and read it on load.
- Tailwind’s `dark:` variants handle inverted color schemes automatically.

**Visual Style**: Modern & Flat
- Clean edges, minimal shadows, and vibrant color accents.
- No skeuomorphism—just clear, flat surfaces that highlight data.

**Color Palette**
- Primary Blue: #3B82F6
- Success Green: #10B981
- Warning Orange: #F59E0B
- Error Red: #EF4444
- Info Teal: #0EA5E9
- Background Light: #FFFFFF
- Background Dark: #1F2937
- Text Light: #111827
- Text Dark: #F9FAFB

**Font**
- **Inter** (or a system sans-serif stack): Modern, highly legible at large sizes.

## 4. Component Structure

We group components by purpose and reuse them everywhere:

- **`components/ui/`**: Generic building blocks—buttons, dialogs, tables, sheets.
- **`components/map/`**: Map-specific pieces like markers, polylines, and pop-ups.
- **`app/dashboard/`**: The main dashboard page that stitches everything together.
- **`app/api/`**: Serverless API routes for our Backend-for-Frontend layer.
- **`lib/`**: Utilities and API client logic (e.g., `lib/smartolt-client.ts`).

**Why Component-Based?**
- **Reusability**: One button style used in a dialog is the same as in a table toolbar.
- **Maintainability**: Fix a bug in one component, and you fix it everywhere it’s used.
- **Team Collaboration**: Designers and developers work on isolated pieces without stepping on each other’s toes.

## 5. State Management

**Local State**
- **React `useState`** for simple, local component state (e.g., toggling a dropdown).
- **React `useContext`** for light cross-component state sharing (e.g., current theme).

**Server Data & Real-Time**
- **React Query** or **SWR** for fetching, caching, and polling data from our API routes.
  - Configurable polling (`refetchInterval`) to refresh ONU statuses every 30–60 seconds.
  - Automatic cache invalidation when data changes.

This two-tier approach keeps things simple while ensuring our map and tables show up-to-date information.

## 6. Routing and Navigation

**File-Based Routing**
- We use Next.js App Router (`app/` directory).
- **Pages** become URLs automatically—`app/dashboard/page.tsx` → `/dashboard`.

**Navigation**
- **Next.js `Link`** component for client-side navigation, keeping transitions snappy.
- **Dynamic Routes** for details views—e.g., `app/onu/[id]/page.tsx` to show a single ONU’s history.

**API Routes (BFF)**
- Stored under `app/api/smartolt/`.
- Example: `app/api/smartolt/onus/route.ts` calls SmartOlt endpoints, merges coordinate and status data, and returns a single JSON object to the frontend.

## 7. Performance Optimization

- **Server-Side Rendering (SSR)** for initial page loads to improve Time-to-First-Byte (TTFB).
- **Code Splitting & Dynamic Imports**: Load heavy components (like the map library) only when the dashboard mounts.
- **Image Optimization**: Use Next.js `<Image>` component for any static assets.
- **Caching & Polling**: React Query / SWR cache responses and only re-fetch when needed.
- **Asset Minification**: Handled by Next.js—CSS and JS get minified in production builds.

## 8. Testing and Quality Assurance

**Unit Tests**
- **Vitest** or **Jest** for testing utility functions and the API client (`lib/smartolt-client.ts`).

**Integration Tests**
- **React Testing Library** to verify that components render correctly and interact as expected (e.g., clicking a marker opens a dialog).

**End-to-End (E2E) Tests**
- **Playwright** or **Cypress** to simulate user flows: log in, view map, click an ONU, see details.

**CI/CD**
- **GitHub Actions** runs tests on every pull request and push to `main`.
- Builds Docker images and deploys them automatically if tests pass.

## 9. Conclusion and Overall Frontend Summary

The smartolt-gis-monitor frontend is built on a modern, scalable stack:

- **Next.js** with **TypeScript** for robust, maintainable code.
- **Tailwind CSS** with a flat, modern style and light/dark theming.
- **Radix UI** & **Shadcn/ui** for accessible, reusable components.
- **React Query** (or SWR) for smooth data fetching and real-time updates.
- **Next.js API Routes** as a secure BFF layer hiding our SmartOlt API keys.
- **Testing** across unit, integration, and end-to-end levels.
- **CI/CD** pipeline delivering reliable, containerized deployments.

All these pieces work together to give your Network Operations Center a fast, clear, and reliable GIS monitoring dashboard. Whether you’re tracking a single ONU or scanning an entire city’s fiber network on a 4K wall display, this setup ensures your team always sees the most accurate data in the most intuitive way.