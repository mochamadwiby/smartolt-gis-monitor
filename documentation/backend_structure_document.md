# Backend Structure Document

This document outlines the backend architecture, hosting, and infrastructure components of the **smartolt-gis-monitor** project. It’s written in everyday language so anyone can understand how the backend is built and how it all fits together.

## 1. Backend Architecture

**Overview**  
We’re using a modern JavaScript/TypeScript stack built on Next.js. The backend follows the Backend-for-Frontend (BFF) pattern. In short, Next.js API routes act as a middleman between the frontend and the external SmartOlt API. This keeps our API keys safe on the server and lets us shape the data exactly how the frontend needs it.

**Key Design Patterns and Frameworks**  
- Backend-for-Frontend (BFF) using Next.js API Routes  
- Type safety throughout with TypeScript  
- Drizzle ORM for database access  
- Modular, component-based server code matching the Next.js file structure

**How It Supports**  
- **Scalability**: Server code is containerized with Docker, so we can easily run more instances behind a load balancer.  
- **Maintainability**: TypeScript and Drizzle ORM catch mistakes early. Clear folder structures mean new developers can onboard quickly.  
- **Performance**: We batch and cache calls to the SmartOlt API, and our BFF layer returns only the data the UI needs.

## 2. Database Management

**Database Technology**  
- Type: SQL  
- System: PostgreSQL  
- Access: Drizzle ORM for type-safe queries and migrations

**How Data Is Structured and Accessed**  
- We store user accounts, roles, application settings, ODP (Optical Distribution Point) locations, and cached SmartOlt data in PostgreSQL.  
- All queries go through Drizzle ORM, which prevents SQL injection and ensures consistent data shapes.  
- We use connection pooling to handle multiple concurrent requests and keep response times low.

**Data Management Practices**  
- Regular database backups (daily automated snapshots)  
- Read replicas for analytics or heavy queries  
- Cache frequent SmartOlt API responses in a Redis layer to avoid hitting rate limits

## 3. Database Schema

Below is a human-friendly overview of our main tables, followed by the actual SQL definitions.

**Human-Readable Table Descriptions**  
- **users**: Stores login info, email, password hash, role, and signup date.  
- **settings**: Per-user preferences like light/dark mode.  
- **odps**: Geographic coordinates of distribution points, identified by an external ID.  
- **onus**: Each ONU record links to an ODP, tracks status, and last seen time.  
- **outage_logs**: History of status changes for ONUs (for charts and audits).  
- **cached_responses**: Stores JSON from SmartOlt API to speed up common queries.

**SQL Schema (PostgreSQL)**  
```sql
-- Users and Roles
drop table if exists users cascade;
create table users (
  id             serial   primary key,
  email          text     not null unique,
  password_hash  text     not null,
  role           text     not null default 'operator',
  created_at     timestamptz not null default now()
);

-- User Settings
drop table if exists settings;
create table settings (
  id        serial primary key,
  user_id   integer not null references users(id) on delete cascade,
  theme     text    not null default 'light',
  updated_at timestamptz not null default now()
);

-- Optical Distribution Points (ODPs)
drop table if exists odps;
create table odps (
  id             serial   primary key,
  external_id    text     not null unique,
  name           text,
  latitude       double precision not null,
  longitude      double precision not null,
  created_at     timestamptz not null default now()
);

-- Optical Network Units (ONUs)
drop table if exists onus;
create table onus (
  id             serial   primary key,
  external_id    text     not null unique,
  status         text     not null,
  last_seen      timestamptz not null,
  odp_id         integer  not null references odps(id) on delete cascade,
  created_at     timestamptz not null default now()
);

-- Outage and Status Logs
drop table if exists outage_logs;
create table outage_logs (
  id         serial   primary key,
  onu_id     integer  not null references onus(id) on delete cascade,
  old_status text     not null,
  new_status text     not null,
  changed_at timestamptz not null default now()
);

-- Cached SmartOlt API Responses
drop table if exists cached_responses;
create table cached_responses (
  id            serial   primary key,
  endpoint      text     not null,
  payload       jsonb    not null,
  cached_at     timestamptz not null default now(),
  expires_at    timestamptz not null
);
```

## 4. API Design and Endpoints

We use RESTful API routes under the Next.js `app/api` folder. Every endpoint is a function that calls SmartOlt, our database, or both.

**Authentication Endpoints**  
- `POST /api/auth/login` — Verify credentials and start a session.  
- `POST /api/auth/logout` — End the user session.  
- `GET /api/auth/session` — Check if the user is still signed in.

**SmartOlt Proxy Endpoints (BFF Layer)**  
- `GET /api/smartolt/onus`  
  • Fetches all ONU GPS coordinates and statuses, merges them, and returns a single JSON array.  
- `GET /api/smartolt/onus/[external_id]/details`  
  • Fetches detailed status and historical signal data for a specific ONU.  
- `GET /api/smartolt/olt`  
  • Returns a list of all OLTs.  
- `GET /api/smartolt/onu/[external_id]/signal-graph`  
  • Returns data points for signal strength charts.

**Internal Data Endpoints**  
- `GET /api/odps`  
  • List stored ODP locations from our database.  
- `POST /api/odps`  
  • Add or update an ODP entry.  
- `GET /api/settings`  
  • Fetch user settings.  
- `PUT /api/settings`  
  • Update user theme or preferences.

All endpoints validate input, check user sessions, and handle errors with meaningful HTTP status codes.

## 5. Hosting Solutions

We run everything in Docker containers managed by Docker Compose. For production, we deploy to a cloud provider (for example, AWS) with the following setup:

- **Application Servers**: AWS ECS (Fargate) auto-scales Node.js containers running Next.js.  
- **Database**: Amazon RDS for PostgreSQL with automated backups and read replicas.  
- **Redis Cache**: Amazon ElastiCache for Redis to store SmartOlt API responses and rate-limit data.  
- **CDN**: Cloudflare (or AWS CloudFront) to serve static assets and next-generated images.  

**Benefits**  
- Reliability through managed services with built-in failover.  
- Automatic scaling to handle traffic spikes in a NOC.  
- Pay-as-you-go pricing keeps costs in check.

## 6. Infrastructure Components

- **Load Balancer**: AWS Application Load Balancer spreads traffic across multiple Node.js containers.  
- **Caching Layer**: Redis caches frequent SmartOlt API calls to minimize external requests and speed up responses.  
- **Reverse Proxy**: Nginx (inside the container) handles SSL termination and redirects to Next.js.  
- **CDN**: Distributes static files and map tiles closer to the user’s screen (our 4K NOC display).  
- **Auto Scaling**: Monitors CPU/memory and spins up/down containers automatically.

These components work together to deliver fast, reliable results and keep the NOC dashboard responsive at all times.

## 7. Security Measures

- **Authentication & Authorization**:  
  • Better Auth secures login flows and session cookies.  
  • Role-based access control (operator vs. admin).  
- **Data Encryption**:  
  • HTTPS/TLS for all client‐server and server‐server traffic.  
  • Encryption at rest on RDS volumes.  
- **Environment Variables**:  
  • API keys and database credentials live in the container environment, never in source code.  
- **Input Validation**:  
  • All API inputs are checked and sanitized.  
- **ORM Safety**:  
  • Drizzle ORM uses parameterized queries to prevent SQL injection.  
- **Rate Limiting**:  
  • Basic rate limits on our API routes to prevent misuse.

## 8. Monitoring and Maintenance

- **Logging**:  
  • Winston (or a similar library) writes structured logs.  
  • Logs are shipped to a log management service (e.g., Loggly, CloudWatch Logs).  
- **Error Tracking**:  
  • Sentry captures exceptions and performance data.  
- **Metrics**:  
  • Prometheus scrapes container metrics.  
  • Grafana dashboards display CPU, memory, request rates, and SmartOlt API latency.  
- **Health Checks**:  
  • AWS ECS health checks restart unhealthy containers automatically.  
- **CI/CD**:  
  • GitHub Actions runs tests (unit, integration, end-to-end) on every push.  
  • Successful builds automatically deploy updated Docker images.

## 9. Conclusion and Overall Backend Summary

In summary, our backend is a containerized, TypeScript-based BFF built on Next.js. It uses a PostgreSQL database (via Drizzle ORM) and Redis caching to deliver a secure, high-performance GIS monitoring dashboard. Hosted on managed cloud services with load balancing, auto-scaling, and CDN distribution, this setup ensures reliability and fast data updates for NOC operators. Thorough security practices, monitoring tools, and CI/CD pipelines keep the system safe, observable, and easy to maintain. Together, these components fulfill the project’s goals: a scalable, maintainable, and responsive backend supporting a real-time NOC GIS view.