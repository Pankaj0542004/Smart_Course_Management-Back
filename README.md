# Smart Course Management — Backend

This repository folder contains the Node.js/Express backend for the Smart Course Management project.

This README documents how to run the backend locally, the environment variables required for production, and how to deploy to Render (manifest included at repo root).

## Contents

- `server.js` — application entry point
- `src/` — application source (routes, controllers, models, utils)
- `.env.example` — example environment variables

## Requirements

- Node.js >= 16
- npm (or yarn/pnpm)
- A MongoDB database (MongoDB Atlas recommended for production)

## Environment variables

Create a `.env` file in `Backend/` (do NOT commit it). Use `Backend/.env.example` as a template. Required variables:

- `MONGODB_URI` — MongoDB connection string (e.g. Atlas URI)
- `JWT_SECRET` — long random secret for signing access tokens
- `JWT_REFRESH_SECRET` — (optional) long secret for refresh tokens
- `CLIENT_ORIGIN` — allowed CORS origin for the frontend (e.g. `https://your-frontend.vercel.app`)
- `NODE_ENV` — set to `production` in prod environments
- `PORT` — optional; Render/prod platforms provide this automatically
- `ACCESS_TOKEN_EXPIRES_IN` — e.g. `1h` (defaults to `1h`)
- `REFRESH_TOKEN_EXPIRES_IN` — e.g. `7d` (defaults to `7d`)

Security note: never commit `.env` or raw secrets. Use a secret manager or Render/Vercel environment variables.

## Quickstart — Local development

1. From the repository root or directly inside the `Backend/` folder:

```powershell
cd "d:\Project\Internship Project\FIna\Backend"
cp .env.example .env        # copy and fill in values (Windows: use copy .env.example .env)
npm install
npm run dev                 # runs nodemon server.js (hot reload)
```

2. The server runs on `http://localhost:5000` by default. Health check: `GET /health`.

3. API routes are mounted under `/api` (e.g., `GET /api/courses`). See `src/routes` for details.

## Production (start)

The `start` script defined in `Backend/package.json` runs:

```text
node server.js
```

On a host or platform (Render), set the environment variables and use the start command. Render's `render.yaml` in the repository root is already configured to run `cd Backend && npm start`.

## Render deployment

This repo includes a `render.yaml` at the repo root that declares a Web Service for the backend. The manifest will:

- Run `cd Backend && npm install` during build
- Start the service with `cd Backend && npm start`
- Use `/health` as the health check endpoint

Steps to deploy on Render:

1. Create/Import the repo in Render. Render will detect `render.yaml` and create the service.
2. In the Render service settings, set environment variables (MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_ORIGIN, NODE_ENV=production).
3. Deploy and monitor build/runtime logs via the Render dashboard. Verify the `/health` endpoint returns `{ "status": "ok" }`.

## Docker (optional)

If you prefer containerized deployment, add a production-ready `Dockerfile` (not included by default). A minimal example:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
CMD ["node","server.js"]
```

If you'd like, I can add a tested Dockerfile and a `docker-compose.yml` for local development.

## Database and indexes

- The app uses Mongoose and expects `MONGODB_URI`. For production, use MongoDB Atlas and enable TLS.
- On startup the server attempts to reconcile indexes for the `Course` model (`Course.syncIndexes()`), and will log any index reconciliation steps. Monitor logs for index migration errors.

## Health check

Request: `GET /health`

Response example:

```json
{ "status": "ok" }
```

Render/Load balancers use this endpoint to determine instance health.

## Common commands

- `npm run dev` — start with nodemon for local development
- `npm start` — start production server
- `npm install` — install dependencies

## Logs and troubleshooting

- Check console output for Mongoose connection errors (authentication, network, or URI formatting).
- If the service fails to start on Render, open the Build & Runtime logs and look for errors such as `MONGODB_URI is not defined` or `Failed to start server`.
- Use `git check-ignore -v Backend/.env Backend/node_modules` to confirm `.env`/node_modules are ignored locally.

## Git and secrets

- `Backend/.gitignore` and repository root `.gitignore` include `Backend/.env` and `Backend/node_modules/` to prevent committing sensitive files and dependencies.
- If secrets were accidentally committed, rotate them immediately and consider removing them from git history (BFG or `git filter-repo`). Contact the team before rewriting shared history.

### Stop tracking previously committed files

If `Backend/.env` or `Backend/node_modules` were already committed, run the following from repo root to stop tracking (keeps local files):

```powershell
git rm -r --cached "Backend/node_modules"
git rm --cached "Backend/.env"
git add .gitignore
git commit -m "Ignore backend node_modules and .env"
git push
```

## Security & best practices

- Use a secrets manager (Render's env vars, Vercel env vars, HashiCorp Vault, or AWS Secrets Manager) in production.
- Enforce strong `JWT_SECRET` values (minimum 32+ random bytes) and rotate periodically.
- Use TLS for MongoDB connections and restrict inbound IP addresses (Atlas IP whitelist).

## Contact / Maintainers

If you need help with deployment, secrets rotation, or adding Docker support, open an issue in the repo or contact the project maintainer.

---
Generated: October 31, 2025
