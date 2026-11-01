# Supabase PostgreSQL Setup

## 1. Create a Supabase project

1. Create a project in Supabase.
2. Wait for the PostgreSQL database to finish provisioning.
3. Reset the database password if the connection string may have been shared.

## 2. Get the connection string

Open **Project Settings > Database > Connection string**, select **URI**, and copy the pooler URI.
Replace the password placeholder with the Supabase database password.

Example format:

```text
postgresql://postgres.PROJECT_REF:[PASSWORD]@HOST:5432/postgres
```

Do not commit the connection string or place it in frontend environment variables.

## 3. Configure local development

Create `backend/.env` from the example and set:

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:[PASSWORD]@HOST:5432/postgres
PORT=5000
NODE_ENV=development
ADMIN_KEY=replace-with-a-long-private-key
FRONTEND_ORIGIN=http://localhost:5173
```

## 4. Run migrations

Migrations run automatically when the backend starts. They are idempotent and recorded in the
`schema_migrations` table. To start the API:

```bash
cd backend
npm install
npm start
```

## 5. Render deployment

In the Render service environment, configure:

- `DATABASE_URL`: the Supabase pooler URI
- `PORT`: `10000` or let Render provide it
- `NODE_ENV`: `production`
- `ADMIN_KEY`: a long private moderation key
- `FRONTEND_ORIGIN`: the deployed Vercel frontend origin

Keep the Render start command as `npm start` and the root directory as `backend`.

## 6. Verify the database

Check migration startup with:

```text
https://your-render-service.onrender.com/api/health
```

The health endpoint should return `{ "status": "ok" }`.

To verify tables directly in Supabase SQL Editor:

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Confirm that `projects`, `project_ratings`, and `schema_migrations` exist, then run the
application's public project and admin moderation flows.
