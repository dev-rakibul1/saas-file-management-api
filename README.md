# SaaS File Management API

A clean, modular, BPSNX-style backend foundation with JWT auth, bcrypt password security, centralized error handling, and a complete `user` module.

## Tech

- Express + TypeScript
- Prisma + PostgreSQL
- JWT auth
- bcrypt password hashing
- ESLint + Prettier + Husky + lint-staged

## Folder Structure

```text
src/
├── app/
│   ├── db/
│   ├── errors/
│   ├── middlewares/
│   ├── modules/
│   │   └── user/
│   ├── routes/
│   └── utils/
├── config/
├── app.ts
└── server.ts
```

## Setup

```bash
yarn install
cp .env.example .env
yarn prisma:generate
yarn dev
```

## API Routes

Base: `/api/v1/users`

- `POST /register` - create user
- `POST /login` - login and get `loginToken` + `accessToken`
- `GET /profile` - get authenticated profile
- `PATCH /profile` - update authenticated profile

Use `Authorization: Bearer <accessToken>` for protected routes.
