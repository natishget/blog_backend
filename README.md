# Blog Backend API

NestJS + Prisma + PostgreSQL backend for a blog platform with authentication, blogs, comments, likes, ratings, uploads, and notifications.

## Features

- Auth with JWT (login/register/logout, protected routes)
- Users (admin-only create/list, self update/delete)
- Blogs (CRUD, search)
- Likes, comments, ratings
- Uploads via Cloudinary
- Prisma migrations and schema

## Tech Stack

- NestJS (TypeScript)
- Prisma ORM
- PostgreSQL
- JWT + Passport
- Cloudinary

## Project Setup

```bash
pnpm install
```

## Environment Variables

Create a `.env` file with at least:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"
JWT_SECRET="your_secret"
IS_PRODUCTION="false"

# Cloudinary (for uploads)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

## Database

```bash
pnpm prisma generate
pnpm prisma migrate deploy
```

For local development, you can also use:

```bash
pnpm prisma migrate dev
```

## Run the Server

```bash
# development
pnpm start:dev

# production
pnpm build
pnpm start:prod
```

## Tests

```bash
# unit tests
pnpm test

# e2e tests
pnpm test:e2e

# coverage
pnpm test:cov
```

## Useful Commands

```bash
pnpm lint
pnpm format
```

## API Notes

- Most routes are protected with JWT.
- Admin-only routes: user creation and listing.
- Blog responses include rating totals/average and `isLikedByMe` when applicable.

## License

UNLICENSED
