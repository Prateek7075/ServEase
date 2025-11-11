# ServEase

ServEase is a full-stack service marketplace application that connects people who need work done (Needy) with service providers. This repository contains two primary projects:

- `servease-backend` — Node.js + Express API with MongoDB for data storage.
- `servease-frontend` — Vite + React single-page application used by end users.

This README documents the repository structure, how to run the app locally (Windows PowerShell), environment variables, API surface, development workflow, testing suggestions, deployment guidance, and troubleshooting tips.

---

## Table of contents

- Project overview
- Tech stack
- Repository structure
- Quick start (local development)
  - Prerequisites
  - Backend setup
  - Frontend setup
- Environment variables
- API reference (high-level)
- Models & schema (summary)
- Authentication & middleware
- Development notes & workflows
- Testing
- Linting & formatting
- Deployment
- Troubleshooting
- Contributing
- License

---

## Project overview

ServEase is designed to let users post jobs (requests for service), review providers, and allow providers to list their services and respond to jobs. The backend exposes a REST API consumed by the React frontend. Authentication, authorization and email utilities are included.

This README is intended to help new developers set up, run, and extend the project.

---

## Tech stack

- Backend: Node.js, Express, MongoDB (Mongoose), JWT-based auth
- Frontend: React (Vite), modern JS (ES Modules)
- Other utilities: Nodemailer (email sending helper), middleware for auth

---

## Repository structure (important files/folders)

Top-level:

- `README.md` - this file
- `servease-backend/` - backend project
- `servease-frontend/` - frontend project

servease-backend (key files):

- `server.js` - backend entry point
- `package.json` - backend dependencies and scripts
- `.env` - backend environment variables (not committed) — see Environment variables section
- `config/db.js` - MongoDB / database connection
- `middleware/auth.js` - JWT auth middleware (protect routes)
- `models/` - Mongoose schemas
  - `User.js` - user model
  - `Job.js` - job model
  - `Review.js` - review model
- `routes/api/` - Express routes grouped by resource
  - `auth.js` - authentication endpoints
  - `users.js` - user CRUD / profile endpoints
  - `jobs.js` - job listing/posting endpoints
  - `reviews.js` - reviews endpoints
  - `providers.js` - provider-related endpoints
- `utils/emailSender.js` - email sending helper (Nodemailer wrapper)

servease-frontend (key files):

- `package.json` - frontend dependencies and scripts
- `vite.config.js` - Vite config
- `index.html` - app entry HTML
- `src/main.jsx` - React app bootstrap
- `src/App.jsx` - top level React component
- `src/context/AuthContext.jsx` - central auth provider / context
- `src/components/layout/Navbar.jsx` - site navigation UI
- `src/components/layout/PrivateRoute.jsx` - route guard for auth-protected pages
- `src/pages/` - page components grouped by role (Needy / Provider / Auth)
- `src/assets/styles/` - CSS files used across app

---

## Quick start (local development)

Prerequisites

- Node.js 18+ (recommended) and npm
- MongoDB (local instance or cloud Atlas)
- Windows PowerShell (commands below target PowerShell)

Important note: open two terminals (or use multiplexer) — one for backend and one for frontend.

Backend setup (servease-backend)

1. Open a PowerShell terminal and change to the backend folder:

```powershell
cd .\servease-backend
```

2. Install dependencies:

```powershell
npm install
```

3. Create a `.env` file in `servease-backend/` with required variables (see Environment variables section).

4. Start the backend:

- To run in production mode:

```powershell
node server.js
```

- If a `dev` script (e.g., using nodemon) is provided in `package.json`, start with:

```powershell
npm run dev
```

Backend will typically listen on the `PORT` configured in `.env` (default commonly 3000 or 5000).

Frontend setup (servease-frontend)

1. Open a second PowerShell terminal and change to the frontend folder:

```powershell
cd .\servease-frontend
```

2. Install dependencies:

```powershell
npm install
```

3. Start the Vite development server:

```powershell
npm run dev
```

4. Open the displayed local URL in your browser (commonly `http://localhost:5173/` by default for Vite).

Tip: if the frontend expects a prepared API base URL, set the appropriate `VITE_` environment variable in frontend (e.g., `VITE_API_BASE_URL=http://localhost:5000/api`). Vite will expose `VITE_` variables to the client.

---

## Environment variables

Create a `.env` file in `servease-backend/` with at least the following entries (names may vary slightly; check `server.js` and `config/db.js` if needed):

- `PORT` — HTTP port for the backend (e.g., 5000)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secret used for signing JWT tokens
- `JWT_EXPIRES_IN` — optional token expiry setting (e.g., `7d`)
- `EMAIL_HOST` — SMTP host for emails (or `EMAIL_SERVICE` for known providers)
- `EMAIL_PORT` — SMTP port
- `EMAIL_USER` — SMTP username
- `EMAIL_PASS` — SMTP password
- `CLIENT_URL` — optional frontend URL used for email links

Example `.env` (do not commit to source control):

```text
PORT=5000
MONGO_URI=mongodb://localhost:27017/servease
JWT_SECRET=super_secret_change_me
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=super-secret-password
CLIENT_URL=http://localhost:5173
```

If you use MongoDB Atlas, `MONGO_URI` will be the Atlas connection URI. Keep secrets safe.

---

## API reference (high-level)

The backend exposes REST endpoints under `/api/*` grouped by route files in `routes/api/`. This is a high-level summary — check the corresponding route files for exact paths, request body shapes, and responses.

Auth (`routes/api/auth.js`)
- POST `/api/auth/register` — create a new user
- POST `/api/auth/login` — login and receive JWT token
- GET `/api/auth/me` — get current user (protected)
- POST `/api/auth/forgot-password` — request password reset (if implemented)
- POST `/api/auth/reset-password` — reset password (if implemented)

Users (`routes/api/users.js`)
- GET `/api/users/:id` — fetch user profile
- PUT `/api/users/:id` — update user profile (protected, likely for owner)
- GET `/api/users` — list users (admin or search, if implemented)

Jobs (`routes/api/jobs.js`)
- GET `/api/jobs` — list jobs
- GET `/api/jobs/:id` — get job details
- POST `/api/jobs` — post a new job (authenticated)
- PUT `/api/jobs/:id` — update a job (owner only)
- DELETE `/api/jobs/:id` — delete a job (owner only)

Providers (`routes/api/providers.js`)
- GET `/api/providers` — list providers
- GET `/api/providers/:id` — provider profile/details
- Additional provider-related endpoints (e.g., apply to job) may exist

Reviews (`routes/api/reviews.js`)
- POST `/api/reviews` — leave a review for a provider or job (authenticated)
- GET `/api/reviews/job/:jobId` — get reviews for a job
- GET `/api/reviews/provider/:providerId` — get reviews for a provider

Notes:
- Many endpoints are protected by `middleware/auth.js`. The middleware verifies JWT and attaches user information to the request.
- For full request/response details, consult each file under `servease-backend/routes/api/`.

---

## Models & schema (summary)

The models live in `servease-backend/models/`. Below are typical fields to expect — check the actual model files for the precise schema and validations.

User (approx)
- name, email, password (hashed), role (Needy / Provider), bio, contact details, rating, createdAt, updatedAt

Job (approx)
- title, description, location, budget, createdBy (user ref), assignedProvider (user ref), status (open/assigned/completed), createdAt

Review (approx)
- rating (number), comment, job (ref), reviewer (user ref), reviewee (provider ref), createdAt

---

## Authentication & middleware

- JWT-based authentication is implemented in `middleware/auth.js`. Protected routes should use this middleware; it typically reads an Authorization header `Bearer <token>` and validates it.
- Frontend stores token in memory or localStorage (look in `src/context/AuthContext.jsx`). Ensure secure handling of tokens in production.

---

## Development notes & workflows

- Use two terminals for frontend and backend development.
- Backend: add `nodemon` as a dev dependency and run `npm run dev` for automatic reloads (if not present, consider adding it).
- Frontend: Vite provides a fast dev server with HMR.
- If you add new environment variables for the frontend, prefix them with `VITE_` so Vite exposes them to client code.

Security notes:
- Never commit `.env` to the repository.
- Use strong `JWT_SECRET` and rotate regularly in production.
- Sanitize and validate request bodies server-side.


