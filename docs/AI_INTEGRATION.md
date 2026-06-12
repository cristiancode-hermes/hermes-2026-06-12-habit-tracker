# AI Integration

## Ladder Rung: 2 — Structured Pattern Analysis

This project implements **AI Ladder Rung 2**: the backend produces structured, formatted analysis of user data without an external LLM. The insights are deterministic but patterned after what an LLM would produce.

## How It Works

The `InsightsService` is the core AI engine. It receives hydrated habit data (habits + their entries) and runs three analysis passes:

### 1. Streak Detection

```typescript
// Pseudocode
for each habit:
  sort entries by date descending
  compute consecutive-day runs
  if last entry was within 48h:
    streak = current run length
  else:
    streak = 0
  emit StreakInsight if streak > 0
```

Streaks use a sliding window that allows up to 48 hours gap (in case the user missed yesterday but logged today).

### 2. Pattern Analysis

```typescript
// Pseudocode
for each habit with >= 3 entries:
  compute day-of-week distribution
  if any single day accounts for >40% of activity:
    emit PatternInsight with recommendation
```

This detects meaningful patterns like "you always exercise on Fridays" and suggests balancing the schedule.

### 3. Weekly Summary

Aggregates all streak data and habits into a plain-language performance summary.

## Architecture

```
InsightsController
  |
  v
InsightsService.generateInsights()
  |--- computeStreak(habit) -> {current, best}
  |--- analyzePattern(habit) -> string | null
  |--- aggregateSummary(habits, streaks) -> string
  |
  v
Insight[] (persisted to database)
```

## Upgrading to Rung 3 (LLM Integration)

To replace the deterministic engine with an LLM:

1. Create an `LlmInsightsService` that calls OpenAI/Anthropic
2. Pass the habit+entry data as structured context in the prompt
3. Parse the LLM response into structured Insight objects
4. Add `OPENAI_API_KEY` to `.env.example`

Example prompt structure:

```
You are a habit coach analyzing a user's tracking data.
Habits tracked: {{habitSummaries}}
Recent entries: {{entrySummaries}}
Generate 3-5 insights covering streaks, patterns, and recommendations.
Return as JSON array with {type, title, content, data} fields.
```
