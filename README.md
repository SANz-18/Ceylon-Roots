# Ceylon Roots — Cinnamon Export & Ordering Platform

Full-stack rebuild of the prototype using **Spring Boot** (Java, REST API, JWT auth, JPA)
and **React** (Vite, react-router, Chart.js).

## Features
- **Role-based access control** — Admin / Logistics Staff / Buyer, enforced both in the UI (route
  guards) and on the server (Spring Security + `@PreAuthorize`).
- **Ordering & secure payment (simulated)** — cart → checkout → payment with server-side card
  validation (Luhn check, expiry, CVV), plus PayPal / wire transfer / LankaQR / COD flows.
- **Order tracking** — a 7-stage lifecycle (Confirmed → Processing → Packed → Shipped → In Transit
  → Customs → Delivered) with a full audit history, a "quill tracker" UI, and a public
  no-login tracking-code lookup.
- **Analytics dashboards** — revenue by month, orders by status, sales by grade, local vs.
  international split, ratings and sentiment distribution (Chart.js).
- **Feedback + sentiment analysis** — buyers review delivered orders; a keyword-based sentiment
  engine scores each review Positive/Neutral/Negative with matched keywords shown for transparency;
  admins can reply.

## Project structure
```
ceylon-roots/
  backend/   Spring Boot 3 (Java 17), Maven, H2 in-memory DB, JWT auth
  frontend/  React 18 (Vite), react-router-dom, axios, chart.js
```

## Running the backend
Requires Java 17+ and Maven.
```bash
cd backend
mvn spring-boot:run
```
- API runs on **http://localhost:8080**
- H2 console (dev only): http://localhost:8080/h2-console (JDBC URL `jdbc:h2:mem:ceylonroots`, user `sa`, blank password)
- Demo data (users, products, sample orders and feedback) is seeded automatically on first run —
  see `DataSeeder.java`. Data resets whenever the app restarts (in-memory DB).

To switch to a persistent database, edit `backend/src/main/resources/application.yml` and swap the
H2 datasource block for MySQL/Postgres (commented example included in the file), then add the
corresponding JDBC driver to `pom.xml`.

## Running the frontend
Requires Node 18+.
```bash
cd frontend
npm install
npm run dev
```
- App runs on **http://localhost:5173** and proxies `/api/*` to the backend on port 8080
  (see `vite.config.js`).

## Demo accounts
| Role  | Email                     | Password  |
|-------|---------------------------|-----------|
| Admin | admin@ceylonroots.lk      | admin123  |
| Staff | staff@ceylonroots.lk      | staff123  |
| Buyer | buyer@ceylonroots.lk      | buyer123  |

Or register a new buyer account from the sign-in screen.

## Notes for your report
- **Payment is simulated.** The backend validates card format (Luhn algorithm, expiry, CVV) but
  never contacts a real card network — appropriate for a coursework demo, but flag this clearly if
  discussing PCI-DSS compliance.
- **JWT secret** in `application.yml` is a placeholder — in production this should come from an
  environment variable, never be committed to source control.
- **RBAC** is enforced in two places by design: Spring Security URL rules / `@PreAuthorize` on the
  server (the real boundary), and React route guards on the client (for UX only — never trust the
  client alone).
- The H2 database is in-memory and resets on every restart, which is intentional for a
  repeatable demo/viva. Swap in MySQL/Postgres for a persistent deployment.
