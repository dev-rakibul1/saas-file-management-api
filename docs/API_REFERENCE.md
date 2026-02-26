# SaaS File Management API - Full Reference

## 1. Overview

Base URL: `http://localhost:5000/api/v1`

Health check:

- `GET /` -> API running message (no auth)

This API enforces package limits for folder/file actions and uses JWT bearer authentication.

## 2. Authentication and Authorization

### 2.1 Token Type

Use `accessToken` from login:

```http
Authorization: Bearer <accessToken>
```

### 2.2 Roles

- `USER`: folder/file/subscription operations
- `ADMIN`: package CRUD + admin monitoring

### 2.3 Default Bootstrapped Data

On server startup, API ensures:

- Packages: `Free`, `Silver`, `Gold`, `Diamond`
- Admin user from env:
  - `DEFAULT_ADMIN_EMAIL`
  - `DEFAULT_ADMIN_PASSWORD`

## 3. Standard Response Format

### 3.1 Success envelope

```json
{
  "statusCode": 200,
  "success": true,
  "message": "...",
  "data": {},
  "meta": {}
}
```

### 3.2 Error envelope

```json
{
  "success": false,
  "message": "Validation failed.",
  "errorMessages": [{ "path": "body.email", "message": "A valid email is required." }]
}
```

Notes:

- `meta` is present for paginated endpoints.
- Validation errors are returned from Zod.
- JWT errors return 401 with `Invalid or expired token.`

## 4. Environment Variables

Required backend env keys:

- `PORT`
- `DATABASE_URL`
- `FRONTEND_URL`
- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_LOGIN_SECRET`
- `JWT_LOGIN_EXPIRES_IN`
- `BCRYPT_SALT_ROUNDS`
- `ENABLE_TEST_ROLE_SWITCH`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`
- `REQUEST_BODY_LIMIT`
- `DEFAULT_ADMIN_NAME`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`

## 5. Endpoint Reference

## 5.1 User/Auth Module

### `POST /users/register`

Auth: `No`

Body:

```json
{
  "name": "Rakibul Islam",
  "email": "fl.rakibul@gmail.com",
  "password": "123456"
}
```

Behavior:

- Creates user with role `USER`
- Auto-subscribes user to active `Free` package

### `POST /users/login`

Auth: `No`

Body:

```json
{
  "email": "rakib@example.com",
  "password": "secret123"
}
```

Response `data`:

```json
{
  "user": {
    "id": "...",
    "name": "Rakibul Islam",
    "email": "rakib@example.com",
    "role": "USER"
  },
  "accessToken": "...",
  "loginToken": "..."
}
```

### `GET /users/profile`

Auth: `USER | ADMIN`

### `PATCH /users/profile`

Auth: `USER | ADMIN`

Body (any one):

```json
{
  "name": "New Name",
  "email": "new@example.com",
  "password": "newpass123"
}
```

### `PATCH /users/test-role`

Auth: `USER | ADMIN`

Body:

```json
{
  "role": "USER"
}
```

Rules:

- Test-purpose endpoint only
- Controlled by `ENABLE_TEST_ROLE_SWITCH`
- Returns warning message and is not a production requirement
- Prevents switching the final remaining `ADMIN` to `USER`

## 5.2 Package Module

### `POST /packages`

Auth: `ADMIN`

Body:

```json
{
  "name": "Starter Plus",
  "maxFolders": 30,
  "maxNestingLevel": 5,
  "allowedFileTypes": ["IMAGE", "PDF"],
  "maxFileSizeBytes": 10485760,
  "totalFileLimit": 200,
  "filesPerFolder": 30
}
```

Allowed `allowedFileTypes` values:

- `IMAGE`
- `VIDEO`
- `AUDIO`
- `PDF`

### `GET /packages`

Auth: `USER | ADMIN`

Query:

- `includeInactive=true` (useful for admin)

### `GET /packages/:id`

Auth: `USER | ADMIN`

### `PATCH /packages/:id`

Auth: `ADMIN`

Body: any subset of create fields + optional `isActive`

### `DELETE /packages/:id`

Auth: `ADMIN`

Behavior:

- Soft delete by setting `isActive = false`
- If any active subscription exists on that package -> rejects

## 5.3 Subscription Module

### `GET /subscriptions/packages`

Auth: `USER | ADMIN`

Returns active packages for selection.

### `POST /subscriptions/select`

Auth: `USER`

Body:

```json
{
  "packageId": "uuid"
}
```

Behavior:

- Old active subscription becomes `SWITCHED` + `isActive=false`
- New package becomes active immediately
- Existing files/folders remain untouched

### `GET /subscriptions/current`

Auth: `USER | ADMIN`

### `GET /subscriptions/history`

Auth: `USER | ADMIN`

## 5.4 Folder Module

### `POST /folders`

Auth: `USER`

Body:

```json
{
  "name": "Projects",
  "parentId": "optional-folder-uuid"
}
```

Enforced before create:

- max folder limit
- max nesting level

### `GET /folders`

Auth: `USER`

Query:

- `parentId=<uuid>` optional

### `GET /folders/tree`

Auth: `USER`

Returns hierarchical tree with children arrays.

### `PATCH /folders/:id`

Auth: `USER`

Body:

```json
{
  "name": "Renamed Folder"
}
```

### `DELETE /folders/:id`

Auth: `USER`

Behavior:

- Deletes folder subtree (children)
- Deletes DB file records in subtree
- Tries cleanup of related Cloudinary assets

## 5.5 File Module

### `POST /files/upload`

Auth: `USER`

Body:

```json
{
  "folderId": "uuid",
  "originalName": "invoice.pdf",
  "mimeType": "application/pdf",
  "contentBase64": "data:application/pdf;base64,JVBERi0x..."
}
```

Validation before upload:

- allowed file type by package
- max file size
- total file count
- files per folder
- MIME type + extension consistency check

Storage:

- Uploaded asset is stored in Cloudinary (`resource_type=auto`)
- DB stores `storedName=cloudinary_public_id` and `storagePath=secure_url`

### `GET /files`

Auth: `USER`

Query:

- `folderId=<uuid>` optional

### `GET /files/:id/download`

Auth: `USER`

Returns redirect to Cloudinary secure URL (or local download if legacy disk file exists).

### `PATCH /files/:id`

Auth: `USER`

Body:

```json
{
  "originalName": "new-name.pdf"
}
```

### `DELETE /files/:id`

Auth: `USER`

Behavior:

- Deletes DB row
- Tries cleanup of stored Cloudinary asset

## 5.6 Admin Monitoring Module

### `GET /admin/users`

Auth: `ADMIN`

Query:

- `page` (string integer)
- `limit` (string integer)
- `packageId` (uuid)

Returns user list with active package and usage (`folderCount`, `fileCount`) + pagination `meta`.

### `GET /admin/users/:id/usage`

Auth: `ADMIN`

Returns single user profile, active subscription, folder/file counts, total storage bytes.

### `GET /admin/overview`

Auth: `ADMIN`

Returns aggregated system summary and package distribution.

## 6. cURL Quick Start

### Register

```bash
curl -X POST http://localhost:5000/api/v1/users/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Rakib","email":"rakib@example.com","password":"secret123"}'
```

### Login

```bash
curl -X POST http://localhost:5000/api/v1/users/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"rakib@example.com","password":"secret123"}'
```

### Create folder (USER token)

```bash
curl -X POST http://localhost:5000/api/v1/folders \
  -H 'Authorization: Bearer <USER_ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Projects"}'
```

### Admin overview (ADMIN token)

```bash
curl http://localhost:5000/api/v1/admin/overview \
  -H 'Authorization: Bearer <ADMIN_ACCESS_TOKEN>'
```

## 7. Frontend Integration Notes

- Frontend should always use `accessToken` in `Authorization` header.
- For upload, send base64 payload from browser `FileReader.readAsDataURL`.
- For download, call `/files/:id/download` and handle blob response.
