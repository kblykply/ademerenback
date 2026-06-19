# Adem Eren Decoration Backend

Standalone Node backend for catalog products.

## Run

```bash
cd ademerenback
npm run dev
```

Default URL:

```text
http://localhost:4000
```

## Environment

Use `example.env` as the setup reference.

```bash
PORT=4000
ADMIN_TOKEN=change-this-before-deploy
CORS_ORIGIN=http://localhost:3000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are optional for local file
mode. When both are set, the backend stores products, homepage content, and
contact requests in Supabase.

Keep `SUPABASE_SERVICE_ROLE_KEY` only on the backend hosting service. Do not add
it to the frontend/Vercel public environment.

Optional table name overrides:

```bash
SUPABASE_PRODUCTS_TABLE=catalog_products
SUPABASE_SITE_CONTENT_TABLE=site_content
SUPABASE_LEADS_TABLE=leads
SUPABASE_STORAGE_BUCKET=product-images
```

Optional Prisma connection for database control:

```bash
DATABASE_URL="postgresql://postgres.gngkjroffszplxnvswtj:[YOUR-PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.gngkjroffszplxnvswtj:[YOUR-PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

## Supabase Setup

In Supabase, open SQL Editor and run:

```sql
-- See ademerenback/supabase-schema.sql
```

After the backend is deployed with Supabase env vars, open the admin panel and
save the catalog once. That first save seeds the Supabase tables with the
current products and site content.

## Prisma

Prisma is configured for the existing Supabase tables:

- `catalog_products`
- `site_content`
- `leads`

Add `DATABASE_URL` to `ademerenback/.env`, then run:

```bash
npm run prisma:generate
npm run prisma:validate
npm run prisma:studio
```

Use Prisma Studio to view and edit DB records locally.

For Supabase Prisma, use the transaction-mode pooler on port `6543` for
`DATABASE_URL` and the session-mode pooler on port `5432` for `DIRECT_URL`.
Prisma 7 reads those values from `prisma.config.ts`.

## API

- `GET /health`
- `GET /api/status`
- `GET /api/categories`
- `GET /api/products?q=oak&category=spc-parke&limit=20&offset=0`
- `GET /api/products/export`
- `GET /api/products/:slug`
- `PUT /api/products`
- `POST /api/products/reset`
- `GET /api/site-content`
- `GET /api/site-content/export`
- `PUT /api/site-content`
- `POST /api/site-content/reset`
- `POST /api/leads`
- `POST /api/uploads`
- `GET /api/leads`
- `GET /api/leads/export`
- `PUT /api/leads/:id`
- `DELETE /api/leads/:id`
- `POST /api/leads/reset`

Catalog, content, and lead admin routes require:

```text
x-admin-token: ADMIN_TOKEN
```

Without Supabase, product edits are saved to:

```text
ademerenback/data/products.json
```

Without Supabase, homepage/content edits are saved to:

```text
ademerenback/data/site-content.json
```

Without Supabase, sample request leads are saved to:

```text
ademerenback/data/leads.json
```

## Docker

```bash
docker build -t ademerenback .
docker run -p 4000:4000 --env-file example.env ademerenback
```

For deployment, host this backend separately and set the frontend environment:

```bash
BACKEND_URL=https://your-backend-domain.com
BACKEND_ADMIN_TOKEN=same-token-as-backend
ADMIN_PASSWORD=your-admin-panel-password
```
