# SaaS File Management API

Backend API for a subscription-based SaaS file and folder management platform.

## Technical Assessment Quick Info

- GitHub Repository: [Backend Repo Link](https://github.com/<your-username>/<backend-repo>)
- Live API Link: [https://saas-file-management-api.vercel.app/](https://saas-file-management-api.vercel.app/)
- Live Frontend Link: [https://saas-storage-frontend.vercel.app/](https://saas-storage-frontend.vercel.app/)
- Environment Template: [`.env.example`](.env.example)
- Database Design PDF: [`docs/erd/saas-file-management-erd.pdf`](docs/erd/saas-file-management-erd.pdf)

Demo credentials:

- Admin: `fl.rakibul@gmail.com` / `12345678`
- User: `demo.user@zoomit.com` / `12345678` (register once if not seeded)

## 1) Requirement Coverage

Implemented modules:

- Authentication and authorization (`USER`, `ADMIN`)
- Package CRUD (Admin-managed, DB-driven limits)
- User subscription selection and switching
- Folder management with depth and count enforcement
- File upload/list/download/rename/delete with package enforcement
- Central enforcement engine for business rules
- Admin monitoring and usage overview
- Test-only role switch endpoint (explicitly non-production requirement)

All package limits are DB-driven and not hardcoded in request handlers.

## 2) Product Flow

1. Server bootstraps default packages and default admin from `.env`.
2. User registers and gets active `Free` package (if available/active).
3. User creates folders/uploads files.
4. Every create/upload call is validated by active package limits.
5. User can switch package; new limits apply immediately for future actions.
6. Admin monitors users, package assignment, and usage summary.

## 3) Tech Stack

- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT auth (Bearer token)
- Zod validation
- Cloudinary for file storage

## 4) Setup

Node requirement: `>=20`

```bash
npm install
cp .env.example .env
# set DATABASE_URL in .env to your own PostgreSQL/Neon connection string
npx prisma migrate dev
npx prisma generate
npm run dev
```

Server URL: `http://localhost:5000`

Build/lint:

```bash
npm run build
npm run lint
```

## 5) Environment Variables

| Key                       | Required    | Description                                           |
| ------------------------- | ----------- | ----------------------------------------------------- |
| `PORT`                    | Yes         | API port                                              |
| `NODE_ENV`                | Yes         | Runtime environment                                   |
| `DATABASE_URL`            | Yes         | PostgreSQL connection string                          |
| `FRONTEND_URL`            | Recommended | Allowed CORS origin(s), comma-separated (origin only) |
| `JWT_ACCESS_SECRET`       | Yes         | Access token secret                                   |
| `JWT_ACCESS_EXPIRES_IN`   | Yes         | Access token TTL (ex: `1d`)                           |
| `JWT_LOGIN_SECRET`        | Yes         | Login token secret                                    |
| `JWT_LOGIN_EXPIRES_IN`    | Yes         | Login token TTL (ex: `15m`)                           |
| `BCRYPT_SALT_ROUNDS`      | Yes         | Password hash salt rounds                             |
| `ENABLE_TEST_ROLE_SWITCH` | Recommended | Enables `PATCH /users/test-role`                      |
| `CLOUDINARY_CLOUD_NAME`   | Yes         | Cloudinary cloud name                                 |
| `CLOUDINARY_API_KEY`      | Yes         | Cloudinary API key                                    |
| `CLOUDINARY_API_SECRET`   | Yes         | Cloudinary API secret                                 |
| `CLOUDINARY_FOLDER`       | Recommended | Cloudinary base folder                                |
| `REQUEST_BODY_LIMIT`      | Recommended | JSON/body size limit (default `25mb`)                 |
| `DEFAULT_ADMIN_NAME`      | Recommended | Seed admin display name                               |
| `DEFAULT_ADMIN_EMAIL`     | Recommended | Seed admin email                                      |
| `DEFAULT_ADMIN_PASSWORD`  | Recommended | Seed admin password                                   |

## 6) Auth and Response Contract

Base API URL: `http://localhost:5000/api/v1`

Auth header for protected routes:

```http
Authorization: Bearer <accessToken>
```

Success response envelope:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Success message",
  "data": {}
}
```

Error response envelope:

```json
{
  "success": false,
  "message": "Error message",
  "errorMessages": [{ "path": "body.field", "message": "Details" }]
}
```

## 7) Business Rules (Enforcement Engine)

### Folder create checks

- Max folders per user
- Max nesting depth

### File upload checks

- Allowed file category by package (`IMAGE`, `VIDEO`, `AUDIO`, `PDF`)
- MIME and extension consistency
- Per-file max size
- Total file count per user
- Files per folder limit

### Package switch behavior

- New limits apply immediately
- Existing files/folders remain untouched
- Future operations are restricted by new limits

## 8) Complete API Endpoint List

Note:

- `Auth` column values: `Public`, `USER`, `ADMIN`, `USER|ADMIN`
- All paths below are relative to `/api/v1`

### Health

| Method | Endpoint                      | Auth   | Description      |
| ------ | ----------------------------- | ------ | ---------------- |
| `GET`  | `/` (root, outside `/api/v1`) | Public | API status check |

### User/Auth

| Method  | Endpoint           | Auth        | Description                            |
| ------- | ------------------ | ----------- | -------------------------------------- |
| `POST`  | `/users/register`  | Public      | Register new user (`role=USER`)        |
| `POST`  | `/users/login`     | Public      | Login and receive tokens               |
| `GET`   | `/users/profile`   | USER\|ADMIN | Current user profile                   |
| `PATCH` | `/users/profile`   | USER\|ADMIN | Update name/email/password             |
| `PATCH` | `/users/test-role` | USER\|ADMIN | Test-only role switch (`USER`/`ADMIN`) |

`/users/test-role` warning:

- For testing only, not production requirement
- Can be disabled by `ENABLE_TEST_ROLE_SWITCH=false`
- Prevents demoting the last remaining `ADMIN`

### Packages (Admin-managed)

| Method   | Endpoint        | Auth        | Description                    |
| -------- | --------------- | ----------- | ------------------------------ |
| `POST`   | `/packages`     | ADMIN       | Create package                 |
| `GET`    | `/packages`     | USER\|ADMIN | List packages                  |
| `GET`    | `/packages/:id` | USER\|ADMIN | Package details                |
| `PATCH`  | `/packages/:id` | ADMIN       | Update package                 |
| `DELETE` | `/packages/:id` | ADMIN       | Soft delete/inactivate package |

### Subscriptions

| Method | Endpoint                  | Auth        | Description                     |
| ------ | ------------------------- | ----------- | ------------------------------- |
| `GET`  | `/subscriptions/packages` | USER\|ADMIN | List selectable active packages |
| `POST` | `/subscriptions/select`   | USER        | Select/switch package           |
| `GET`  | `/subscriptions/current`  | USER\|ADMIN | Current active subscription     |
| `GET`  | `/subscriptions/history`  | USER\|ADMIN | Subscription history            |

### Folders

| Method   | Endpoint        | Auth | Description                        |
| -------- | --------------- | ---- | ---------------------------------- |
| `POST`   | `/folders`      | USER | Create folder or sub-folder        |
| `GET`    | `/folders`      | USER | List folders (optional `parentId`) |
| `GET`    | `/folders/tree` | USER | Hierarchical folder tree           |
| `PATCH`  | `/folders/:id`  | USER | Rename folder                      |
| `DELETE` | `/folders/:id`  | USER | Delete folder subtree              |

### Files

| Method   | Endpoint              | Auth | Description                                                  |
| -------- | --------------------- | ---- | ------------------------------------------------------------ |
| `POST`   | `/files/upload`       | USER | Upload base64 file to Cloudinary                             |
| `GET`    | `/files`              | USER | List files (optional `folderId`)                             |
| `GET`    | `/files/:id/download` | USER | Download file (Cloudinary redirect or legacy local download) |
| `PATCH`  | `/files/:id`          | USER | Rename file                                                  |
| `DELETE` | `/files/:id`          | USER | Delete file and cleanup cloud asset                          |

Upload body contract (`POST /files/upload`):

```json
{
  "folderId": "uuid",
  "originalName": "invoice.pdf",
  "mimeType": "application/pdf",
  "contentBase64": "data:application/pdf;base64,JVBERi0x..."
}
```

### Admin Monitoring

| Method | Endpoint                 | Auth  | Description                    |
| ------ | ------------------------ | ----- | ------------------------------ |
| `GET`  | `/admin/users`           | ADMIN | Paginated user list with usage |
| `GET`  | `/admin/users/:id/usage` | ADMIN | Single user usage details      |
| `GET`  | `/admin/overview`        | ADMIN | System-level overview metrics  |

## 9) Frontend Integration Notes

- Frontend base URL should be `http://localhost:5000/api/v1`
- Keep access token in auth context and send in `Authorization` header
- File upload is JSON base64 (respect `REQUEST_BODY_LIMIT`)
- Dashboard screens map directly to modules above

Frontend project docs:

- `../saas-storage-frontend/README.md`
- `../saas-storage-frontend/docs/FRONTEND_INTEGRATION.md`

## 10) Troubleshooting

- `404 API path not found`: method/path mismatch (example: `GET /users` does not exist)
- `413 Request payload is too large`: increase `REQUEST_BODY_LIMIT` or upload smaller file
- `401 Invalid or expired token`: login again and use fresh `accessToken`
- `400 No active package found`: user must have an active subscription
- `Prisma P1001` on startup: verify `DATABASE_URL` credentials. Test with `psql "$DATABASE_URL" -c "select 1"`. If auth fails, copy a fresh connection string from your DB provider (Neon) and update `.env`.

## 11) Additional Docs

- Full API reference: `docs/API_REFERENCE.md`
- Requirement source: `requirement/requirement.md`

## 12) Deploy on Vercel (Backend)

This repository is Vercel-ready with:

- Vercel entry handler: `src/vercel.ts`
- Vercel config: `vercel.json`
- Build script: `npm run vercel-build`

Vercel project settings:

1. Root Directory: `saas-file-management-api`
2. Framework Preset: `Other`
3. Install Command: `npm install`
4. Build Command: `npm run vercel-build`
5. Output Directory: leave empty

Required Vercel environment variables:

- `NODE_ENV=production`
- `DATABASE_URL`
- `FRONTEND_URL` (your frontend Vercel domain origin, comma-separated if multiple)
- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_LOGIN_SECRET`
- `JWT_LOGIN_EXPIRES_IN`
- `BCRYPT_SALT_ROUNDS`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`
- `REQUEST_BODY_LIMIT`
- `DEFAULT_ADMIN_NAME`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`
- `ENABLE_TEST_ROLE_SWITCH` (set `false` in production)

Important:

- Run DB migration separately before/with deployment (`npx prisma migrate deploy`).
- File upload size is subject to both `REQUEST_BODY_LIMIT` and Vercel function request limits.
