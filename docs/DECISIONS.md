# Decision Log

## ADR-001: Monorepo Structure with Independent package.jsons

**Date**: 2026-06-12

**Context**: The project needs to host an Angular frontend and a NestJS backend. Options: Nx monorepo, Turbo repo, or fully independent apps under a shared root.

**Decision**: Use a flat monorepo with independent `package.json` files in `apps/api` and `apps/web`, managed by a root `package.json` with convenience scripts.

**Alternatives considered**:
- **Nx**: Powerful but adds complexity and build overhead for a 2-app project
- **Angular+Nest combined CLI**: Ties versions tightly and makes independent deployment harder

**Consequences**: Each app manages its own dependencies. Root scripts provide shorthand. Builds are fully independent.

---

## ADR-002: TypeORM with synchronize for Dev

**Date**: 2026-06-12

**Context**: Need database schema management for a daily-built project with limited time.

**Decision**: Use TypeORM with `synchronize: true` in development. Production should switch to migrations.

**Alternatives considered**:
- **Drizzle**: Better type safety but different API surface from the existing skill set
- **Prisma**: Excellent but heavier setup for a daily build
- **Raw SQL**: Would require a migration runner and more manual work

**Consequences**: Fast iteration in development. Must remember to disable `synchronize` in production.

---

## ADR-003: Signal-First Angular with Zone.js

**Date**: 2026-06-12

**Context**: Angular 22 defaults to signals but the project scaffold uses zone.js. Full zoneless requires `provideZonelessChangeDetection()`.

**Decision**: Use signal-based component state (`signal()`, `computed()`) and signal-based inputs/outputs, but keep `provideZoneChangeDetection()` for now to avoid edge cases with third-party libraries.

**Alternatives considered**:
- **Full zoneless**: Cleaner but can cause issues with async pipes and third-party libs
- **Full RxJS**: More familiar but signals are the Angular 22 recommended approach

**Consequences**: Components are signal-first. Zone.js is present but minimally used. Can switch to full zoneless in a future refactor.

---

## ADR-004: SQLite for Development, Postgres for Production

**Date**: 2026-06-12

**Context**: The mission prompt specifies Neon (Postgres) but the environment doesn't have a Neon API key available.

**Decision**: Use `better-sqlite3` for local development with a single config toggle to switch to Postgres.

**Alternatives considered**:
- **Require Neon setup**: Would block the build if credentials aren't available
- **Use Postgres locally**: Requires running a Postgres container, adds complexity

**Consequences**: Dev uses SQLite (no external DB needed). The `.env.example` documents the Postgres configuration. TypeORM abstracts the differences.

---

## ADR-005: AI Strategy Pattern

**Date**: 2026-06-12

**Context**: The AI capability should be easy to upgrade from Rung 2 (deterministic analysis) to Rung 3+ (LLM-powered).

**Decision**: The `InsightsService` is designed as a self-contained analysis engine with clear method boundaries (`computeStreak`, `analyzePattern`, `generateInsights`). An `LLMInsightsStrategy` can be added later without changing the controller or entity.

**Consequences**: Clean separation. Adding LLM support requires only a new strategy class and a configuration flag.

---

## ADR-006: JWT Auth with PBKDF2 Password Hashing

**Date**: 2026-06-12

**Context**: Need secure user authentication without external auth providers.

**Decision**: Use JWT with Passport.js for token management, and PBKDF2 with random salts for password hashing.

**Alternatives considered**:
- **bcrypt**: Standard but requires native bindings (potential build issues)
- **argon2**: Most secure but heavier dependency
- **plain text** (rejected): Obviously insecure

**Consequences**: No native dependencies for password hashing. PBKDF2 with 10000 iterations is reasonable for a habit tracker.
