# Independent Learning Module

A self-directed learning system that allows students to explore curated educational content outside their enrolled courses, while tracking progress and engagement.

## Overview

The Independent Learning Module provides:
- **Curated Content Library**: Browse educational content organized by categories (History, Astronomy, Wildlife, etc.)
- **Self-paced Learning**: Enroll in content and complete lessons at your own pace
- **Progress Tracking**: Track completion percentage and resume from where you left off
- **Admin Dashboard**: Manage categories, content, and lessons with analytics

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Database | PostgreSQL 16 (Docker) |
| ORM | Drizzle ORM with Bun SQL driver |
| Auth | Better Auth (email/password, sessions) |
| Backend | Hono (web framework) |
| API Client | Hono RPC (type-safe client) |
| Frontend | React 19 |
| Routing | TanStack Router |
| Styling | Tailwind CSS + shadcn/ui |

### Database Schema

```
categories          learning_content        learning_lessons
    │                     │                       │
    └──── 1:N ────────────┘                       │
                          │                       │
                          └──────── 1:N ──────────┘
                          │
    user ─── 1:N ─── student_content_enrollments
      │
      └───── 1:N ─── student_lesson_progress
```

## API Endpoints

### Public Routes (Student-facing)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/learning/content` | List published content |
| GET | `/api/learning/content/:slug` | Get content with lessons |
| GET | `/api/learning/categories` | List all categories |
| POST | `/api/learning/content/:id/enroll` | Enroll in content |
| GET | `/api/learning/my-library` | Get enrolled content |
| POST | `/api/learning/lessons/:id/complete` | Mark lesson complete |

### Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/categories` | List categories |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/:id` | Update category |
| DELETE | `/api/admin/categories/:id` | Delete category |
| GET | `/api/admin/content` | List all content |
| POST | `/api/admin/content` | Create content |
| PUT | `/api/admin/content/:id` | Update content |
| DELETE | `/api/admin/content/:id` | Delete content |
| POST | `/api/admin/lessons/content/:id/lessons` | Add lesson |
| PUT | `/api/admin/lessons/:id` | Update lesson |
| DELETE | `/api/admin/lessons/:id` | Delete lesson |
| GET | `/api/admin/analytics` | Get analytics |

## Getting Started

### Prerequisites

- Bun 1.3+
- Docker (for PostgreSQL)

### Setup

1. **Start PostgreSQL**
   ```bash
   docker compose up -d
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Run database migrations**
   ```bash
   bun run db:push
   ```

4. **Seed the database**
   ```bash
   bun run db:seed
   ```

5. **Start the development server**
   ```bash
   bun run dev
   ```

6. **Access the app**
   - Home: http://localhost:3000
   - Admin: http://localhost:3000/admin

### Creating an Admin User

To access the admin dashboard, you need to create a user and set their role to "admin":

1. Sign up at http://localhost:3000/admin
2. Update the user's role in the database:
   ```sql
   UPDATE "user" SET role = 'admin' WHERE email = 'your@email.com';
   ```

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server |
| `bun run start` | Start production server |
| `bun run test` | Run tests |
| `bun run db:generate` | Generate migrations |
| `bun run db:migrate` | Run migrations |
| `bun run db:push` | Push schema to database |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run db:seed` | Seed database |

## Project Structure

```
src/
├── server/
│   ├── index.ts              # Hono app entry
│   ├── db/
│   │   ├── index.ts          # Database connection
│   │   ├── schema/           # Drizzle schemas
│   │   └── seed.ts           # Seed script
│   ├── lib/
│   │   ├── auth.ts           # Better Auth config
│   │   └── progress.ts       # Progress utilities
│   ├── middleware/
│   │   └── auth.ts           # Auth middleware
│   └── routes/
│       ├── auth.ts           # Auth routes
│       ├── learning.ts       # Public learning routes
│       └── admin/            # Admin routes
│           ├── index.ts
│           ├── categories.ts
│           ├── content.ts
│           ├── lessons.ts
│           └── analytics.ts
└── client/
    ├── App.tsx               # Main app entry
    ├── router.tsx            # TanStack Router config
    ├── lib/
    │   ├── api.ts            # Hono RPC client
    │   └── auth.ts           # Auth client
    ├── components/
    │   ├── ui/               # shadcn/ui components
    │   └── auth/             # Auth forms
    └── pages/
        ├── Home.tsx          # Home page
        └── admin/            # Admin dashboard
            ├── index.tsx     # Page exports
            ├── Layout.tsx
            ├── Dashboard.tsx
            ├── Categories.tsx
            ├── Content.tsx
            └── ContentEditor.tsx
```

## Future Enhancements (V2)

- Smart content recommendations
- Certificates of completion
- Gamification (badges, leaderboards)
- Social learning and peer interaction
- Advanced analytics and reporting
- Offline mode support
