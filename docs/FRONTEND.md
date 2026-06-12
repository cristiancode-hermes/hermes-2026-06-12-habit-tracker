# Frontend Architecture

## Signal Architecture

The Angular frontend follows Angular 22's signal-first paradigm. Here's how state is managed:

### Component State Pattern

```typescript
// Every component uses this pattern:
const items = signal<Item[]>([]);       // mutable state
const loading = signal(true);            // loading flag
const computed = computed(() =>          // derived state
  items().filter(i => i.active)
);
```

### State Ownership

| State | Owner | Type | Notes |
|-------|-------|------|-------|
| Auth token | AuthService (singleton) | writable signal | Persisted to localStorage |
| User email | AuthService | readonly signal | Derived from localStorage |
| Habits list | HabitsListComponent | writable signal | Fetched from API on init |
| Current habit | HabitDetailComponent | writable signal | Fetched by route param |
| Streaks | DashboardComponent | writable signal (dict) | Computed per-habit |
| Insights | InsightsComponent | writable signal | Fetched/generated on demand |

### Service Layer

Two services:

- **AuthService**: Manages JWT token lifecycle, provides `isLoggedIn` computed signal
- **ApiService**: Centralized HTTP client, adds JWT header to every request

### Lazy Loading

All feature components are lazy-loaded via `loadComponent()`:

```typescript
{
  path: 'habits',
  loadComponent: () => import('./habits/habits-list.component').then(m => m.HabitsListComponent),
}
```

### Control Flow

The template uses Angular 22's new `@if`, `@for`, `@switch` control flow exclusively:

```html
@for (habit of habits(); track habit.id) {
  <div>{{ habit.name }}</div>
} @empty {
  <p>No habits yet</p>
}
```

### Zoneless Notes

The app uses `provideZoneChangeDetection()` for compatibility. Signal-based components can switch to full zoneless by:
1. Removing `provideZoneChangeDetection()`
2. Adding `provideZonelessChangeDetection()`
3. Removing all `NgZone` usage and `async` pipe references

### noop

```typescript
// httpResource (Angular 22) would replace HttpClient for signal-native
// data fetching. Not used yet because it's experimental.
// const habits = httpResource<Habit[]>('/api/habits');
```

### Styling

Tailwind CSS is configured with a custom color palette (primary blues, accent purples). No component-level CSS files exist — all styling is in-template utility classes.
