# Hermes Habit Tracker

An AI-powered habit tracking application built with **Angular 22** (signal-first, zoneless), **NestJS 11**, **Tailwind CSS**, and **SQLite/Postgres** (Neon-ready). Track your daily habits, visualize streaks, and get intelligent pattern analysis.

```
┌─────────────────────────────────────────────┐
│  HabitTracker                                │
│  ┌───────────────────────────────────────┐   │
│  │ Dashboard   Habits   Insights   Demo  │   │
│  ├───────────────────────────────────────┤   │
│  │ Active Habits:   6    Active Streaks   │   │
│  │                  ┌──────────┐         │   │
│  │ Morning Meditation    14-day streak   │   │
│  │ Reading               7-day streak    │   │
│  │ Exercise              5-day streak    │   │
│  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Features

- **User authentication** — JWT-based register/login with password hashing
- **Habit CRUD** — Create, edit, pause, and delete habits with configurable frequency
- **Daily check-ins** — Log entries for each habit with date, count, and optional notes
- **Streak tracking** — Automatic current/best streak calculation per habit
- **AI-powered insights** — Pattern analysis engine generating streak alerts, weekly distributions, and performance summaries (AI Ladder Rung 2)
- **Responsive design** — Tailwind CSS with a consistent design system

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 22 (standalone, signals, zoneless) |
| Backend | NestJS 11 (modules, guards, Swagger) |
| Database | SQLite (dev) / PostgreSQL with Neon (production) |
| ORM | TypeORM 1.0 |
| Auth | JWT (passport-jwt) |
| AI | Structured pattern analysis engine |
| Styling | Tailwind CSS 3 |
| API Docs | Swagger / OpenAPI |

## Architecture Overview

```
┌─────────────┐     HTTP/JSON     ┌──────────────┐     TypeORM     ┌──────────┐
│ Angular 22  │ ◄──────────────► │ NestJS API    │ ◄────────────► │ SQLite   │
│ (signals)   │   JWT Bearer     │ (4 modules)   │                │ /Postgres│
│ Zoneless    │                   │ Auth, Habits, │                │          │
│ Tailwind    │                   │ Entries,      │                │          │
│             │                   │ Insights      │                │          │
└─────────────┘                   └──────────────┘                └──────────┘
```

## Prerequisites

- Node.js 22+
- npm 10+
- Angular CLI 22+ (`npx @angular/cli`)
- NestJS CLI 11+ (`npx @nestjs/cli`)

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url> habit-tracker
cd habit-tracker
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
```

### 2. Environment

Copy `.env.example` to `.env` (root of the monorepo):

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
PORT=3000
DATABASE_TYPE=better-sqlite3
DATABASE_PATH=./data/habits.db
JWT_SECRET=your-secure-secret-here
```

For Neon/Postgres (production):

```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/habits
```

### 3. Run database migrations (auto-sync)

TypeORM is configured with `synchronize: true` for development. The schema is auto-created on first run.

### 4. Seed database

```bash
cd apps/api && npm run seed
```

Creates a demo user (`demo@example.com` / `demo123456`) with 6 habits and 14 days of entries.

### 5. Start the API

```bash
cd apps/api && npm run start
```

API runs at `http://localhost:3000/api`. Swagger docs at `http://localhost:3000/api/docs`.

### 6. Start the frontend

```bash
cd apps/web && npm start
```

App runs at `http://localhost:4200`.

## The AI Capability (Rung 2)

This project implements **AI Ladder Rung 2**: structured pattern analysis.

The Insights engine analyzes habit entries and generates:

1. **Streak alerts** — when a habit has an active streak, it celebrates the milestone
2. **Pattern detection** — identifies weekly distribution patterns (e.g., "you tend to exercise most on Tuesdays")
3. **Weekly summaries** — aggregates performance across all habits

The engine is designed with a clean interface that can be upgraded to use LLM-based analysis (Rung 3+) by implementing a new strategy.

## Roadmap

- [ ] **Neon Data API** — Direct RLS-protected reads from Angular via Neon Data API
- [ ] **LLM-powered insights** — OpenAI/Anthropic integration for natural language analysis (Rung 3)
- [ ] **Social features** — Share habits, friend streaks, challenges
- [ ] **Push notifications** — Daily reminders via Web Push API
- [ ] **Charts & visualization** — Weekly/monthly performance charts
- [ ] **CI/CD pipeline** — GitHub Actions for automated testing and deployment
- [ ] **E2E tests** — Playwright/Cypress for full integration testing

## Project Structure

```
habit-tracker/
├── apps/
│   ├── api/                  # NestJS backend
│   │   └── src/
│   │       ├── auth/         # Auth module (JWT)
│   │       ├── habits/       # Habits CRUD module
│   │       ├── entries/      # Daily entries module
│   │       ├── insights/     # AI insights module
│   │       └── seed.ts       # Database seeder
│   └── web/                  # Angular frontend
│       └── src/app/
│           ├── auth/         # Login/Register
│           ├── dashboard/    # Main dashboard
│           ├── habits/       # Habits list + detail
│           ├── insights/     # AI insights view
│           └── shared/       # Auth + API services
├── docs/                     # Documentation
├── .gitignore
├── .env.example
├── LICENSE
└── README.md
```

## License

MIT
