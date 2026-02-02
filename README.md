# 🚙 Shelby4Runner Content OS

A production-quality content planning system that transforms road trip itineraries into day-by-day content calendars for social media creators. Built with Next.js, TypeScript, and the Anthropic API.

## Features

- **AI-Powered Parsing**: Paste any road trip plan (ChatGPT output, notes, etc.) and automatically parse it into structured days
- **Content Generation**: Generate hooks, shot lists, B-roll ideas, and caption seeds for each day
- **Customizable Settings**: Adjust tone (raw/poetic/funny/minimal), posting cadence, and content pillars
- **Status Tracking**: Track content from planned → filmed → edited → posted
- **Local Storage**: All data persisted locally with no auth required
- **Export/Import**: Export projects as JSON for backup or sharing
- **Mobile-Friendly**: Responsive design works on all devices

## Setup

### 1. Clone and Install

```bash
git clone [repository-url]
cd content.scheduler
npm install
```

### 2. Configure Anthropic API

1. Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. Copy the environment file:
   ```bash
   cp .env.local.example .env.local
   ```
3. Add your API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=your-actual-api-key-here
   ```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using the app.

## How It Works

### Data Flow

1. **Input**: User pastes trip itinerary + provides dates
2. **Parse**: Anthropic API parses text into structured days with locations and vibes
3. **Generate**: For each day, generate content plan (pillar, hook, shots, etc.)
4. **Store**: Save to LocalStorage for persistence
5. **Edit**: User can edit any field, with changes tracked
6. **Export**: Download as JSON or copy to clipboard

### Content Pillars

- **Rig**: 4Runner/gear content
- **Life**: Lifestyle/camping moments
- **Dog**: Shelby (the dog) focused content
- **Journey**: Travel/exploration stories

### Day Vibes

- **Travel**: Long driving days between destinations
- **Camp**: National parks, campgrounds, outdoor spots
- **City**: Urban areas, towns
- **Rest**: Buffer days, maintenance, resupply

## API Architecture

### `/api/anthropic/route.ts`

Handles three modes:

1. **parse_trip**: Converts itinerary text into structured days
2. **generate_day**: Creates content plan for a single day
3. **generate_all_days**: Batch generates content for multiple days

### JSON Schema Validation

Uses Zod schemas to validate all Anthropic responses:
- Ensures valid JSON structure
- Attempts repair if initial response is malformed
- Returns typed, validated data to client

### Prompt Engineering

- System prompt enforces JSON-only responses
- Structured prompts guide content generation
- Tone and emphasis settings customize output
- Practical shot suggestions optimized for phone filming

## Project Structure

```
content.scheduler/
├── app/
│   ├── api/
│   │   └── anthropic/
│   │       └── route.ts         # API endpoint
│   ├── project/
│   │   └── [id]/
│   │       └── page.tsx         # Project detail page
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/
│   ├── DayCard.tsx              # Day display component
│   ├── DayEditor.tsx            # Day editing interface
│   ├── ProjectForm.tsx          # New project form
│   └── ProgressBar.tsx          # Loading indicator
├── lib/
│   ├── types.ts                 # TypeScript types
│   ├── schemas.ts               # Zod validation schemas
│   ├── storage.ts               # LocalStorage utilities
│   ├── prompts.ts               # AI prompt builders
│   └── date.ts                  # Date utilities
└── .env.local                   # Environment variables
```

## Local Storage

Projects are stored in LocalStorage under key: `shelby4runner.projects.v1`

### Storage Functions

- `loadProjects()`: Get all projects
- `saveProjects()`: Save projects array
- `upsertProject()`: Create/update single project
- `deleteProject()`: Remove project
- `exportProject()`: Convert to JSON string
- `importProject()`: Parse JSON string

## Known Limitations

- **No Backend**: All data stored locally in browser
- **No Auth**: Single-user system
- **API Limits**: Subject to Anthropic rate limits
- **Token Limits**: Long trips may need chunking
- **No Maps**: Route planning is text-only (v1)

## Future Enhancements

- Database backend with user accounts
- Map integration for route visualization
- Multi-platform posting scheduler
- Analytics dashboard
- Team collaboration features
- Template library for common trips

## Development

### Build for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

## Troubleshooting

### API Key Issues
- Ensure `.env.local` exists and contains valid key
- Restart dev server after adding key
- Check Anthropic console for API status

### Generation Failures
- Check browser console for errors
- Verify itinerary text isn't empty
- Ensure date range is valid
- Try regenerating individual days

### Storage Issues
- Check browser LocalStorage limits
- Export projects regularly for backup
- Clear storage if corrupted: `localStorage.clear()`

## Support

For issues or feature requests, please open an issue on GitHub.

## License

MIT