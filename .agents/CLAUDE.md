# Shelby4Runner Content OS - Claude Agent Context

## Project Overview

A Next.js web application that transforms road trip itineraries into structured day-by-day content calendars for social media creators. Designed specifically for a 4Runner traveler named Shelby, combining itinerary planning with AI-powered content generation via Claude 3.5 Sonnet.

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **React**: 19.2.3
- **Styling**: Tailwind CSS 4
- **Validation**: Zod 4.3.6
- **AI**: Anthropic API (Claude 3.5 Sonnet)
- **Storage**: Browser LocalStorage (no backend database)

## Project Structure

```
content.scheduler/
├── app/
│   ├── api/anthropic/route.ts    # AI API endpoint (parse & generate)
│   ├── project/[id]/page.tsx     # Project detail/editing page
│   ├── layout.tsx                # Root layout with metadata
│   ├── page.tsx                  # Home page (project listing)
│   └── globals.css               # Global Tailwind styles
├── components/
│   ├── DayCard.tsx               # Day display component
│   ├── DayEditor.tsx             # Day editing interface
│   ├── ProjectForm.tsx           # New project creation form
│   └── ProgressBar.tsx           # Loading progress indicator
├── lib/
│   ├── types.ts                  # TypeScript interfaces
│   ├── schemas.ts                # Zod validation schemas
│   ├── storage.ts                # LocalStorage utilities
│   ├── prompts.ts                # AI prompt builders
│   └── date.ts                   # Date manipulation utilities
```

## Key Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Run production build
npm run lint     # Run ESLint
```

## Environment Variables

Required in `.env.local`:
```
ANTHROPIC_API_KEY=your_api_key_here
```

## Core Data Types

### TripProject
```typescript
{
  id: string;
  title: string;
  startDate: string;      // YYYY-MM-DD
  endDate: string;        // YYYY-MM-DD
  itineraryText: string;
  settings: ProjectSettings;
  days: ContentDay[];
  createdAt: string;
  updatedAt: string;
}
```

### ContentDay
```typescript
{
  id: string;
  date: string;           // YYYY-MM-DD
  dayIndex: number;
  location: string;
  vibe: "travel" | "camp" | "city" | "rest";
  pillar: "rig" | "life" | "dog" | "journey";
  hook: string;           // max 120 chars
  shots: string[];        // 5-8 items
  broll: string[];
  captionSeed: string;
  status: "planned" | "filmed" | "edited" | "posted";
  metrics?: { views, likes, saves, comments };
  notes?: string;
  editedFields?: string[];
}
```

### ProjectSettings
```typescript
{
  tone: "raw" | "poetic" | "funny" | "minimal";
  cadencePerDay: 0 | 1 | 2;
  pillarWeights: { rig, life, dog, journey };  // 0-1 values
  dogEmphasis: "low" | "medium" | "high";
  includeRouteHints: boolean;
}
```

## API Endpoint Modes

`POST /api/anthropic` accepts three modes:

1. **parse_trip** - Parse itinerary text into structured days
2. **generate_day** - Generate content for a single day
3. **generate_all_days** - Batch generate content (chunks of 5)

All responses are validated with Zod schemas and include auto-repair on failure.

## Storage

- **Key**: `shelby4runner.projects.v1`
- **Location**: Browser LocalStorage
- **Functions**: `loadProjects`, `saveProjects`, `upsertProject`, `deleteProject`, `exportProject`, `importProject`

## Validation

Zod schemas in `lib/schemas.ts` enforce:
- Date format: YYYY-MM-DD
- Hook length: max 120 characters
- Shots array: 5-8 items
- Valid enum values for vibe, pillar, tone, status

## Design Patterns

1. **Component Composition** - Reusable DayCard, DayEditor, ProjectForm
2. **API Abstraction** - All Anthropic calls via `/api/anthropic`
3. **Schema Validation** - Zod validates all AI responses
4. **Error Recovery** - Auto-repair mechanism for malformed AI responses
5. **Debounced Saves** - 500ms debounce for LocalStorage writes

## Known Limitations

- No backend/cloud sync (LocalStorage only)
- No authentication (single-user)
- Subject to Anthropic API rate limits
- Long trips may exceed token limits
- No cross-device sync

## Content Pillars

- **rig** - Vehicle/camping gear content
- **life** - Lifestyle/daily life content
- **dog** - Dog-focused content (Shelby the dog)
- **journey** - Travel/adventure narrative

## Vibe Types

- **travel** - On the road, driving days
- **camp** - Camping/outdoor stays
- **city** - Urban exploration
- **rest** - Rest/recovery days
